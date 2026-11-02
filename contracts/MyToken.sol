// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import "./ManagedAccess.sol";

contract MyToken is ManagedAccess {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    string public name;
    string public symbol;
    uint8 public decimals; // uint8 --> 8 bit unsigned int, uint16, ... , uint256

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;


    constructor(string memory _name, string memory _symbol, uint8 _decimal, uint256 _amount
    ) ManagedAccess(msg.sender, msg.sender){
            name = _name;
            symbol = _symbol;
            decimals = _decimal;
        // transaction
        // from, to, data, value, gas,...
        _mint(_amount * 10**uint256(decimals), msg.sender); // _amount MT
    }

    modifier onlyOwnerOrManager {
        require(msg.sender == owner || msg.sender == manager, "You are not authorized");
        _;
    }

    function approve(address spender, uint256 amount) external {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external {
        address spender = msg.sender;
        require(allowance[from][spender] >= amount, "insufficient allowance");
        allowance[from][spender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);

    }

    function mint(uint256 amount, address to) external onlyOwnerOrManager {
        _mint(amount, to);
    }

    function setManager(address _manager) external onlyOwner {
        manager = _manager;
    }

    function _mint(uint256 amount, address to) internal {
        // totalSupply = totalSupply + amount;
        // balanceOf[to] = balanceOf[to] + amount;
        totalSupply += amount;
        balanceOf[to] += amount;
    }

    function transfer(uint256 amount, address to) external {
        require(balanceOf[msg.sender] >= amount, "insufficient balance");
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;

        emit Transfer(msg.sender, to, amount);
    }

    /*
    approve
        - allow spender address to send my tokwn
    transferFrom
        - spender: owner -> target address

    * token owner --> bank contract
    * token owner --> router contract --> bank contract
    * token owner --> router contract --> bank contract(multi contract)

*/
    
}