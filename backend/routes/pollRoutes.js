const express = require("express");
const { deletePoll, getPollResults, endPoll } = require("../controllers/pollController");
const authenticateJWT = require("../middlewares/authenticateJWT");

const router = express.Router();

router.patch("/:pollId/delete", authenticateJWT, deletePoll);
router.patch("/:pollId", authenticateJWT, endPoll);
router.get("/:pollId/results", authenticateJWT, getPollResults);

module.exports = router;

/*

    activePoll,
    setActivePoll,
    pastPolls,
    setPastPolls,
    showPollForm,
    setShowPollForm,
    
*/
