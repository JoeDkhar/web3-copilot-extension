const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken (OpenZeppelin v5)", function () {
  let MyToken, myToken, owner, addr1, addr2;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    MyToken = await ethers.getContractFactory("MyToken");
    myToken = await MyToken.deploy();
  });

  it("Should have correct name, symbol, and decimals", async () => {
    expect(await myToken.name()).to.equal("MyToken");
    expect(await myToken.symbol()).to.equal("MTK");
    expect(await myToken.decimals()).to.equal(18);
  });

  it("Should mint initial supply to owner", async () => {
    const balance = await myToken.balanceOf(owner.address);
    expect(balance).to.equal(ethers.parseEther("100")); // 100 tokens
  });

  it("Owner can mint new tokens", async () => {
    await myToken.mint(addr1.address, ethers.parseEther("50"));
    expect(await myToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
  });

  it("Non-owner cannot mint new tokens", async () => {
    await expect(
      myToken.connect(addr1).mint(addr1.address, ethers.parseEther("50"))
    ).to.be.revertedWithCustomError(myToken, "OwnableUnauthorizedAccount");
  });

  it("Should transfer tokens between accounts", async () => {
    await myToken.transfer(addr1.address, ethers.parseEther("10"));
    expect(await myToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("10"));
    expect(await myToken.balanceOf(owner.address)).to.equal(ethers.parseEther("90"));
  });

  it("Should fail if sender does not have enough tokens", async () => {
    await expect(
      myToken.connect(addr1).transfer(owner.address, ethers.parseEther("1"))
    ).to.be.revertedWithCustomError(myToken, "ERC20InsufficientBalance");
  });

  it("Should approve and update allowance", async () => {
    await myToken.approve(addr1.address, ethers.parseEther("5"));
    expect(await myToken.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("5"));
  });

  it("Should allow spender to transferFrom within allowance", async () => {
    await myToken.approve(addr1.address, ethers.parseEther("5"));
    await myToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("5"));
    expect(await myToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("5"));
    expect(await myToken.balanceOf(owner.address)).to.equal(ethers.parseEther("95"));
  });

  it("Should fail transferFrom if allowance is exceeded", async () => {
    await myToken.approve(addr1.address, ethers.parseEther("2"));
    await expect(
      myToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("3"))
    ).to.be.revertedWithCustomError(myToken, "ERC20InsufficientAllowance");
  });

  it("Should transfer ownership", async () => {
    await myToken.transferOwnership(addr1.address);
    expect(await myToken.owner()).to.equal(addr1.address);
  });
});
