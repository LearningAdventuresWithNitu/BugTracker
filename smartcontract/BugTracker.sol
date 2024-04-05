// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract BugTracker {
    using Strings for uint256;

    uint256 private count = 0;

    enum criticalLevels {
        LOW,
        MEDIUM,
        HIGH
    }

    struct Bug {
        string bugId;
        string description;
        criticalLevels level;
        bool isDone;
    }

    mapping(address => Bug[]) private Users;

    function addBug(string calldata _description) external {
        uint256 bugCounter = ++count;
        string memory baseString = "BUG-";
        string memory _bugId = string(abi.encodePacked(baseString, bugCounter.toString()));

        Users[msg.sender].push(Bug({bugId: _bugId, description: _description, isDone: false, level: criticalLevels.LOW}));
    }

    function getTask(uint256 _bugIndex) external view returns (Bug memory) {
        Bug storage bug = Users[msg.sender][_bugIndex];
        return bug;
    }

    function updateBugStatus(uint256 _bugIndex, bool _status) external {
        Users[msg.sender][_bugIndex].isDone = _status;
    }

    function updateBugLevel(uint256 _bugIndex, criticalLevels _level) external {
        Users[msg.sender][_bugIndex].level = _level;
    }

    function getBugCount() external view returns (uint256) {
        return Users[msg.sender].length;
    }

    function deleteBug(uint256 _bugIndex) external {
        delete Users[msg.sender][_bugIndex];
    }
}