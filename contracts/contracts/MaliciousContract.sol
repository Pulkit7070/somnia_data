// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MaliciousContract
 * @dev Contract with risky patterns that should trigger alerts
 */
contract MaliciousContract {
    address public owner;
    mapping(address => uint256) public balances;
    bool private locked;

    event OwnerChanged(address indexed previousOwner, address indexed newOwner);
    event FundsWithdrawn(address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier noReentrancy() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    // RED FLAG: Allows owner to change without proper governance
    function transferOwnership(address newOwner) public onlyOwner {
        address previousOwner = owner;
        owner = newOwner;
        emit OwnerChanged(previousOwner, newOwner);
    }

    // RED FLAG: Allows anyone to deposit but only owner to withdraw
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // RED FLAG: Owner can withdraw all funds
    function withdrawAll() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Transfer failed");
        emit FundsWithdrawn(owner, amount);
    }

    // RED FLAG: Allows self-destruct (contract upgrade risk)
    function destroy() public onlyOwner {
        selfdestruct(payable(owner));
    }

    // RED FLAG: Reentrancy vulnerability
    function vulnerableWithdraw() public noReentrancy {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        balances[msg.sender] = 0;
    }

    receive() external payable {
        balances[msg.sender] += msg.value;
    }
}
