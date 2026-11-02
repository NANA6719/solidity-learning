import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const MINTING_AMOUNT = 100n;
const DECIMALS = 18n;

describe("mytoken deploy", () => {
  let myTokenC: MyToken;
  let signers: HardhatEthersSigner[];

  before("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
    ]);
  });

  describe("Basic state value check", () => {
    it("should return name", async () => {
      expect(await myTokenC.name()).equal("MyToken");
    });

    it("should return symbol", async () => {
      expect(await myTokenC.symbol()).equal("MT");
    });

    it("should return decimals", async () => {
      expect(await myTokenC.decimals()).equal(DECIMALS);
    });

    it("should return 100 totalSupply", async () => {
      expect(await myTokenC.totalSupply()).equal(
        MINTING_AMOUNT * 10n ** DECIMALS
      );
    });
  });

  // 1MT = 1*10^18
  describe("Mint", () => {
    it("should return 100MT balance for signer 0", async () => {
      const signer0 = signers[0];
      expect(await myTokenC.balanceOf(signer0)).equal(
        MINTING_AMOUNT * 10n ** DECIMALS
      );
    });

    // TDD: Test Driven Development
    it("should return or revert when minting infinitly", async () => {
        const hacker = signers[2];
        const mintingAgainAmount = hre.ethers.parseUnits("10000", DECIMALS);
        await expect(
            myTokenC.connect(hacker).mint(mintingAgainAmount, hacker.address)
        ).to.be.revertedWith("You are not authorized");
    });
  });

  describe("Transfer", () => {
    it("shoud have 0.5MT", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      const amount = hre.ethers.parseUnits("0.5", DECIMALS);

      await expect(myTokenC.transfer(amount, signer1.address))
        .to.emit(myTokenC, "Transfer")
        .withArgs(signer0.address, signer1.address, amount);

      expect(await myTokenC.balanceOf(signer1)).equal(amount);
    });

    it("shoud be reverted with insufficient balance error", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenC.transfer(
          hre.ethers.parseUnits((MINTING_AMOUNT + 1n).toString(), DECIMALS),
          signer1.address
        )
      ).to.be.revertedWith("insufficient balance");
    });
  });

  describe("TransferFrom", () => {
    it("shoud emit Approval event", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      const amount = hre.ethers.parseUnits("10", DECIMALS);

      await expect(myTokenC.approve(signer1, amount))
        .to.emit(myTokenC, "Approval")
        .withArgs(signer0.address, signer1.address, amount);
    });

    it("shoud be reverted with insufficient allowance error", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await expect(
        myTokenC
          .connect(signer1)
          .transferFrom(
            signer0.address,
            signer1.address,
            hre.ethers.parseUnits("11", DECIMALS)
          )
      ).to.be.revertedWith("insufficient allowance");
    });

    it("should approve and transferFrom signer0 to signer1", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      const amount = hre.ethers.parseUnits("5", DECIMALS);

      const before0 = await myTokenC.balanceOf(signer0);
      const before1 = await myTokenC.balanceOf(signer1);

      // signer0 이 signer1 에게 5MT 사용 권한 부여
      await expect(myTokenC.approve(signer1, amount))
        .to.emit(myTokenC, "Approval")
        .withArgs(signer0.address, signer1.address, amount);

      // signer1 이 signer0 의 토큰을 자신(signer1)에게 전송
      await expect(
        myTokenC
          .connect(signer1)
          .transferFrom(signer0.address, signer1.address, amount)
      )
        .to.emit(myTokenC, "Transfer")
        .withArgs(signer0.address, signer1.address, amount);

      const after0 = await myTokenC.balanceOf(signer0);
      const after1 = await myTokenC.balanceOf(signer1);

      expect(after0).equal(before0 - amount);
      expect(after1).equal(before1 + amount);
    });
  });
});
