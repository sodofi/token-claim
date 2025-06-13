// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ClaimToken is ERC20, Ownable {
    uint256 public constant CLAIM_AMOUNT = 10 * 10**18; // 10 tokens with 18 decimals
    
    mapping(address => bool) public hasClaimed;
    
    event TokensClaimed(address indexed claimer, uint256 amount);
    
    constructor() ERC20("ClaimToken", "CLAIM") Ownable(msg.sender) {
        // Mint initial supply to contract owner for distribution
        _mint(address(this), 1000000 * 10**18); // 1 million tokens
    }
    
    function claimTokens() external {
        require(!hasClaimed[msg.sender], "Address has already claimed tokens");
        require(balanceOf(address(this)) >= CLAIM_AMOUNT, "Insufficient tokens in contract");
        
        hasClaimed[msg.sender] = true;
        _transfer(address(this), msg.sender, CLAIM_AMOUNT);
        
        emit TokensClaimed(msg.sender, CLAIM_AMOUNT);
    }
    
    function hasAddressClaimed(address _address) external view returns (bool) {
        return hasClaimed[_address];
    }
    
    function getClaimAmount() external pure returns (uint256) {
        return CLAIM_AMOUNT;
    }
    
    function getContractBalance() external view returns (uint256) {
        return balanceOf(address(this));
    }
    
    // Owner can withdraw remaining tokens if needed
    function withdrawRemainingTokens() external onlyOwner {
        uint256 balance = balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        _transfer(address(this), owner(), balance);
    }
} 