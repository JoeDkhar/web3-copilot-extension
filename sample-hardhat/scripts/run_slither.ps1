param (
  [string]$ContractPath = "sample-hardhat/contracts/ERC20.sol"
)

$projectRoot = (Get-Location).Path
docker run --rm -v "${projectRoot}:/src" ghcr.io/crytic/slither `
  slither /src/$ContractPath --json /src/slither-output.json
