import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';

// Template for ERC20 Solidity contract
const ERC20_TEMPLATE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor(address initialOwner) ERC20("MyToken", "MTK") Ownable(initialOwner) {
        // Mint 100 tokens to msg.sender
        _mint(initialOwner, 100 * 10**decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}`;

// Insert ERC20 template into active editor
function insertERC20Template() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }
    editor.edit((editBuilder) => {
        editBuilder.insert(editor.selection.start, ERC20_TEMPLATE);
    }).then(success => {
        if (success) vscode.window.showInformationMessage('Inserted full ERC20 template');
        else vscode.window.showErrorMessage('Failed to insert ERC20 template');
    });
}

// === Activate extension ===
export function activate(context: vscode.ExtensionContext) {
    console.log('Web3 Copilot is now active!');

    // 1. Insert ERC20 template
    context.subscriptions.push(
        vscode.commands.registerCommand('web3-copilot-proto.insertTemplate', insertERC20Template)
    );

    // 2. Generate NatSpec docs
    context.subscriptions.push(
        vscode.commands.registerCommand('web3-copilot-proto.generateDocs', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            const document = editor.document;
            const text = document.getText();
            const contractRegex = /contract\s+(\w+)(?:\s+is\s+([^{]+))?\s*{/g;
            let match;
            let edit = new vscode.WorkspaceEdit();
            while ((match = contractRegex.exec(text)) !== null) {
                const contractName = match[1];
                const inheritance = match[2] ? match[2].trim() : '';
                const contractPos = document.positionAt(match.index);
                const natspecComment = generateNatSpecForContract(contractName, inheritance);
                edit.insert(document.uri, contractPos, natspecComment);
            }
            vscode.workspace.applyEdit(edit).then(success => {
                if (success) vscode.window.showInformationMessage('NatSpec documentation generated');
                else vscode.window.showErrorMessage('Failed to generate NatSpec documentation');
            });
        })
    );

    // 3. Run Slither via Docker
    context.subscriptions.push(
        vscode.commands.registerCommand('web3-copilot-proto.runSlitherDocker', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            if (!editor.document.fileName.endsWith('.sol')) {
                vscode.window.showErrorMessage('Not a Solidity file');
                return;
            }
            await editor.document.save();
            try {
                const result = await runSlitherDocker(editor.document.fileName);
                const outputChannel = vscode.window.createOutputChannel('Web3 Copilot Analysis');
                outputChannel.clear();
                outputChannel.appendLine(result);
                outputChannel.show();
            } catch (err: any) {
                vscode.window.showErrorMessage(`Slither analysis failed: ${err.message}`);
            }
        })
    );

    // 4. Show deployment metadata in OutputChannel (per network)
    context.subscriptions.push(
        vscode.commands.registerCommand('web3-copilot-proto.showDeployment', async () => {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
            if (!workspaceRoot) {
                vscode.window.showErrorMessage('No workspace open');
                return;
            }

            const deploymentsDir = path.join(workspaceRoot, "sample-hardhat");

            // Find all deployed-contracts.*.json files
            const files = fs.readdirSync(deploymentsDir).filter(f =>
                f.startsWith("deployed-contracts.") && f.endsWith(".json")
            );

            if (files.length === 0) {
                vscode.window.showErrorMessage("No deployment metadata found. Deploy a contract first.");
                return;
            }

            // Extract network names from filenames
            const networks = files.map(f => f.replace("deployed-contracts.", "").replace(".json", ""));

            // Let user pick one
            const network = await vscode.window.showQuickPick(networks, {
                placeHolder: "Select a network to view deployment info"
            });

            if (!network) {
                vscode.window.showInformationMessage("No network selected.");
                return;
            }

            const metadataPath = path.join(deploymentsDir, `deployed-contracts.${network}.json`);
            const data = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
            const latest = data[data.length - 1];

            const outputChannel = vscode.window.createOutputChannel(`Web3 Deployment Info - ${network}`);
            outputChannel.clear();
            outputChannel.appendLine(`=== Latest Deployment Info (${network}) ===`);
            outputChannel.appendLine(`Contract: ${latest.contract}`);
            outputChannel.appendLine(`Address:  ${latest.address}`);
            outputChannel.appendLine(`Network:  ${latest.network}`);
            outputChannel.appendLine(`Deployed: ${latest.timestamp}`);
            outputChannel.appendLine(`ABI Functions: ${latest.abi.length}`);
            outputChannel.show();
        })
    );



    // 5. Generate Hardhat snippet from ABI
    context.subscriptions.push(
        vscode.commands.registerCommand('web3-copilot-proto.generateSnippet', async () => {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
            const deploymentsPath = path.join(workspaceRoot, 'sample-hardhat', 'deployed-contracts.json');
            if (!fs.existsSync(deploymentsPath)) {
                vscode.window.showErrorMessage('No deployed-contracts.json found. Deploy a contract first.');
                return;
            }

            const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf-8'));
            const latest = deployments[deployments.length - 1];
            if (!latest.abi) {
                vscode.window.showErrorMessage('No ABI found in deployment metadata.');
                return;
            }

            // Build QuickPick items with label + full fn object
            const functions: vscode.QuickPickItem[] & { fn?: any }[] = latest.abi
                .filter((item: any) => item.type === "function")
                .map((fn: any) => {
                    const inputs = fn.inputs.map((i: any) => i.type).join(",");
                    return { label: `${fn.name}(${inputs})`, fn }; // attach fn object
                });

            const picked = await vscode.window.showQuickPick(functions, {
                placeHolder: "Select a function to generate a call snippet"
            });
            if (!picked || !("fn" in picked)) return;

            const fn = (picked as any).fn; // now safe
            const args = fn.inputs.map((i: any, idx: number) => {
                if (i.type.startsWith("address")) return "addr1.address"; // demo signer
                if (i.type.startsWith("uint")) return `ethers.parseEther("1")`; // numeric
                if (i.type.startsWith("string")) return `"example"`; // string
                if (i.type.startsWith("bool")) return "true"; // boolean
                return `/* ${i.type} arg${idx} */`;
            }).join(", ");

            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found to insert snippet.');
                return;
            }

            // Distinguish between view and write functions
            const snippet =
                fn.stateMutability === "view" || fn.stateMutability === "pure"
                    ? `
    // Hardhat snippet for ${fn.name} (read-only)
    const [signer, addr1, addr2] = await ethers.getSigners();
    const contract = await ethers.getContractAt("${latest.contract}", "${latest.address}");
    console.log(await contract.${fn.name}(${args}));
    `
                    : `
    // Hardhat snippet for ${fn.name} (transaction)
    const [signer, addr1, addr2] = await ethers.getSigners();
    const contract = await ethers.getContractAt("${latest.contract}", "${latest.address}");
    const tx = await contract.${fn.name}(${args});
    await tx.wait();
    console.log("${fn.name} executed");
    `;

            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.start, snippet);
            });

            vscode.window.showInformationMessage(`Snippet for ${fn.name} inserted`);
        })
    );



    // 6. Open Web3 Chat
    context.subscriptions.push(
        vscode.commands.registerCommand('web3-copilot-proto.openWeb3Chat', () => {
            const panel = vscode.window.createWebviewPanel(
                'web3Chat',
                'Web3 Security Chat',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );
            panel.webview.html = getWebviewContent();
            panel.webview.onDidReceiveMessage(
                message => {
                    if (message.command === 'askQuestion') {
                        const response = getSecurityAdvice(message.text);
                        panel.webview.postMessage({ command: 'response', text: response });
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );
}

// === Helpers ===
function generateNatSpecForContract(contractName: string, inheritance: string): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    return `/**
 * @title ${contractName}
 * @dev Implementation of the ${contractName}${inheritance ? ' inheriting from ' + inheritance : ''}
 * @custom:security-contact security@example.com
 * @author Web3 Copilot
 * @notice This contract is auto-generated and may need additional review
 * @custom:date ${dateStr}
 */
`;
}
async function runSlitherDocker(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '.';
        const dockerCmd = `docker run --rm -v "${workspaceRoot}:/src" ghcr.io/crytic/slither slither "${filePath.replace(workspaceRoot, '/src')}"`;
        cp.exec(dockerCmd, (error, stdout, stderr) => {
            if (error) reject(new Error(stderr || stdout));
            else resolve(stdout);
        });
    });
}
function getSecurityAdvice(question: string): string {
    const lower = question.toLowerCase();
    if (lower.includes('reentrancy')) return "Prevent reentrancy using Checks-Effects-Interactions or ReentrancyGuard.";
    if (lower.includes('overflow')) return "Solidity 0.8.x includes checked arithmetic. Use SafeMath for older versions.";
    if (lower.includes('gas')) return "Avoid unbounded loops and heavy storage writes to reduce gas.";
    if (lower.includes('front')) return "Mitigate front-running with commit-reveal schemes or batch auctions.";
    return "Always prioritize security and testing. Could you clarify your question?";
}
function getWebviewContent() {
    return `
    <html>
    <body>
        <h1>Web3 Security Chat</h1>
        <div id="chat"></div>
        <input type="text" id="input"/>
        <button onclick="send()">Send</button>
        <script>
            const vscode = acquireVsCodeApi();
            function send() {
                const text = document.getElementById('input').value;
                vscode.postMessage({ command: 'askQuestion', text });
            }
            window.addEventListener('message', event => {
                const msg = event.data;
                if (msg.command === 'response') {
                    const div = document.getElementById('chat');
                    div.innerHTML += '<p><b>Bot:</b> ' + msg.text + '</p>';
                }
            });
        </script>
    </body>
    </html>
    `;
}
export function deactivate() {}
