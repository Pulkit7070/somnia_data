// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleSwap
 * @dev Basic DEX for testing swap categorization
 */
contract SimpleSwap is Ownable {
    struct Pool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
    }

    mapping(uint256 => Pool) public pools;
    uint256 public poolCount;

    event PoolCreated(uint256 indexed poolId, address tokenA, address tokenB);
    event Swapped(
        uint256 indexed poolId,
        address indexed user,
        address tokenIn,
        uint256 amountIn,
        uint256 amountOut
    );
    event LiquidityAdded(
        uint256 indexed poolId,
        address indexed provider,
        uint256 amountA,
        uint256 amountB
    );

    constructor() Ownable(msg.sender) {}

    function createPool(
        address tokenA,
        address tokenB
    ) external onlyOwner returns (uint256) {
        uint256 poolId = poolCount++;
        pools[poolId] = Pool({
            tokenA: tokenA,
            tokenB: tokenB,
            reserveA: 0,
            reserveB: 0
        });
        emit PoolCreated(poolId, tokenA, tokenB);
        return poolId;
    }

    function addLiquidity(
        uint256 poolId,
        uint256 amountA,
        uint256 amountB
    ) external {
        Pool storage pool = pools[poolId];
        require(pool.tokenA != address(0), "Pool does not exist");

        IERC20(pool.tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(pool.tokenB).transferFrom(msg.sender, address(this), amountB);

        pool.reserveA += amountA;
        pool.reserveB += amountB;

        emit LiquidityAdded(poolId, msg.sender, amountA, amountB);
    }

    function swap(
        uint256 poolId,
        address tokenIn,
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        Pool storage pool = pools[poolId];
        require(pool.tokenA != address(0), "Pool does not exist");

        bool isTokenA = tokenIn == pool.tokenA;
        require(isTokenA || tokenIn == pool.tokenB, "Invalid token");

        // Simple constant product formula: x * y = k
        uint256 reserveIn = isTokenA ? pool.reserveA : pool.reserveB;
        uint256 reserveOut = isTokenA ? pool.reserveB : pool.reserveA;

        amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);

        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(isTokenA ? pool.tokenB : pool.tokenA).transfer(
            msg.sender,
            amountOut
        );

        if (isTokenA) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }

        emit Swapped(poolId, msg.sender, tokenIn, amountIn, amountOut);
        return amountOut;
    }
}
