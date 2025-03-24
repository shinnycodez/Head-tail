let rotationCount = 0;
let userTeam = "";
let botTeam = "";
let userPlayers = [];
let botPlayers = [];
let userScore = 0;
let botScore = 0;
let userWickets = 0;
let botWickets = 0;
let currentBatsmanIndex = 0;
let isUserBatting = false;
let target = 0;
let isInningsOver = false;
let ballsBowled = 0;
let isFirstInnings = true;

// Over tracking variables
let userBattingOvers = 0;
let botBattingOvers = 0;
let ballsInCurrentOver = 0;

// Anti-spam variables
let lastUserChoices = [];
const MAX_CHOICE_HISTORY = 2;

// Track individual player stats
let userBatsmenStats = [];
let botBatsmenStats = [];
let userBowlersStats = [];
let botBowlersStats = [];

// Start the game by entering team names
function startGame() {
    userTeam = document.getElementById("user-team").value.trim();
    botTeam = document.getElementById("bot-team").value.trim();
    
    if (!userTeam || !botTeam) {
        alert("Please enter both team names.");
        return;
    }
    
    document.getElementById("team-entry").classList.add("hidden");
    document.getElementById("squad-selection").classList.remove("hidden");
    document.getElementById("user-squad-title").textContent = `${userTeam} Playing XI`;
    document.getElementById("bot-squad-title").textContent = `${botTeam} Playing XI`;
}

// Proceed to toss after squad selection
function proceedToToss() {
    // Clear previous player data
    userPlayers = [];
    botPlayers = [];
    lastUserChoices = [];
    
    // Get player inputs
    const userInputs = document.querySelectorAll("#squad-selection .w-full.md\\:w-1\\/2:first-child .squad-input");
    const botInputs = document.querySelectorAll("#squad-selection .w-full.md\\:w-1\\/2:last-child .squad-input");
    
    // Process user team players
    userInputs.forEach((input, index) => {
        const playerName = input.value.trim();
        userPlayers.push(playerName || `${userTeam} Player ${index + 1}`);
    });
    
    // Process bot team players
    botInputs.forEach((input, index) => {
        const playerName = input.value.trim();
        botPlayers.push(playerName || `${botTeam} Player ${index + 1}`);
    });
    
    // Validate at least some players are named
    if (userPlayers.every(name => !name.trim())) {
        alert(`Please name at least some players for ${userTeam}`);
        return;
    }
    if (botPlayers.every(name => !name.trim())) {
        alert(`Please name at least some players for ${botTeam}`);
        return;
    }
    
    // Initialize player stats
    userBatsmenStats = userPlayers.map(() => ({ runs: 0, balls: 0, isOut: false }));
    botBatsmenStats = botPlayers.map(() => ({ runs: 0, balls: 0, isOut: false }));
    userBowlersStats = userPlayers.map(() => ({ wickets: 0, runs: 0, balls: 0 }));
    botBowlersStats = botPlayers.map(() => ({ wickets: 0, runs: 0, balls: 0 }));
    
    // Proceed to next screen
    document.getElementById("squad-selection").classList.add("hidden");
    document.getElementById("game-section").classList.remove("hidden");
}

// Toss the coin and determine the winner
function tossCoin(userChoice) {
    const coin = document.getElementById("coin");
    const result = document.getElementById("result");
    const choiceButtons = document.getElementById("choice-buttons");
    const batBallButtons = document.getElementById("bat-ball-buttons");
    const finalResult = document.getElementById("final-result");

    const isHeads = Math.random() < 0.5;
    rotationCount += 720;
    const finalRotation = isHeads ? 0 : 180;

    coin.style.transform = `rotateY(${rotationCount + finalRotation}deg)`; 

    setTimeout(() => {
        const tossResult = isHeads ? "heads" : "tails";
        if (userChoice === tossResult) {
            result.innerText = `${userTeam} won the toss! Choose to bat or ball.`;
            result.style.color = "lightgreen";
            batBallButtons.classList.remove("hidden");
        } else {
            const botChoice = Math.random() < 0.5 ? "bat" : "ball";
            result.innerText = `${botTeam} won the toss and chooses to ${botChoice}.`;
            result.style.color = "red";
            finalResult.innerText = `${userTeam} will ${botChoice === "bat" ? "bowl" : "bat"}.`;
            isUserBatting = botChoice === "ball";
        }
        choiceButtons.classList.add("hidden");
        document.getElementById("start-innings-button").classList.remove("hidden");
    }, 1500);
}

// Choose to bat or ball
function chooseBatBall(choice) {
    isUserBatting = choice === "bat";
    document.getElementById("final-result").innerText = `You chose to ${choice}.`;
    document.getElementById("bat-ball-buttons").classList.add("hidden");
    document.getElementById("start-innings-button").classList.remove("hidden");
}

// Start the innings
function startInnings() {
    document.getElementById("game-section").classList.add("hidden");
    document.getElementById("gameplay-section").classList.remove("hidden");

    // Reset scores if first innings
    if (isFirstInnings) {
        userScore = 0;
        botScore = 0;
        userWickets = 0;
        botWickets = 0;
        currentBatsmanIndex = 0;
        ballsBowled = 0;
        ballsInCurrentOver = 0;
        userBattingOvers = 0;
        botBattingOvers = 0;
        lastUserChoices = [];
    } else {
        // For second innings, just reset the balls counter
        ballsBowled = 0;
        ballsInCurrentOver = 0;
        lastUserChoices = [];
    }

    // Reset player stats for new innings
    if (isUserBatting) {
        userBatsmenStats = userPlayers.map(() => ({ runs: 0, balls: 0, isOut: false }));
    } else {
        botBatsmenStats = botPlayers.map(() => ({ runs: 0, balls: 0, isOut: false }));
    }

    // Update display
    document.getElementById("user-team-name").innerText = userTeam;
    document.getElementById("bot-team-name").innerText = botTeam;

    if (isUserBatting) {
        document.getElementById("user-team-scorecard-title").innerText = `${userTeam} Batting`;
        document.getElementById("bot-team-scorecard-title").innerText = `${botTeam} Bowling`;
        if (isFirstInnings) {
            document.getElementById("result-text").innerText = `${userTeam} is batting first`;
        } else {
            document.getElementById("result-text").innerText = `${userTeam} needs ${target} to win`;
        }
    } else {
        document.getElementById("user-team-scorecard-title").innerText = `${userTeam} Bowling`;
        document.getElementById("bot-team-scorecard-title").innerText = `${botTeam} Batting`;
        if (isFirstInnings) {
            document.getElementById("result-text").innerText = `${botTeam} is batting first`;
        } else {
            document.getElementById("result-text").innerText = `${botTeam} needs ${target} to win`;
        }
    }
    document.getElementById("result-text").classList.remove("hidden");

    isInningsOver = false;
    updateScorecard();
}

// Update the scorecard with detailed stats
function updateScorecard() {
    const userScorecard = document.getElementById("user-scorecard");
    const botScorecard = document.getElementById("bot-scorecard");

    userScorecard.innerHTML = "";
    botScorecard.innerHTML = "";

    // Update user team scorecard
    userPlayers.forEach((player, index) => {
        const stats = userBatsmenStats[index];
        const playerDiv = document.createElement("div");
        playerDiv.className = "grid grid-cols-12 gap-1 py-1 px-2";
        
        if (index === currentBatsmanIndex && isUserBatting && !stats.isOut) {
            playerDiv.classList.add("bg-yellow-100", "bg-opacity-10");
        }
        
        // Player name
        const nameSpan = document.createElement("div");
        nameSpan.className = "col-span-6 truncate";
        nameSpan.textContent = player;
        
        // Runs
        const runsSpan = document.createElement("div");
        runsSpan.className = "col-span-2 text-center";
        runsSpan.textContent = stats.runs;
        
        // Balls
        const ballsSpan = document.createElement("div");
        ballsSpan.className = "col-span-2 text-center";
        ballsSpan.textContent = stats.balls;
        
        // Strike Rate
        const srSpan = document.createElement("div");
        srSpan.className = "col-span-2 text-center";
        const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0";
        srSpan.textContent = sr;
        
        // Status indicator
        if (stats.isOut) {
            nameSpan.innerHTML += " <span class='text-red-500'>(out)</span>";
        } else if (index === currentBatsmanIndex && isUserBatting) {
            nameSpan.innerHTML += " <span class='text-green-500'>*</span>";
        }
        
        playerDiv.appendChild(nameSpan);
        playerDiv.appendChild(runsSpan);
        playerDiv.appendChild(ballsSpan);
        playerDiv.appendChild(srSpan);
        userScorecard.appendChild(playerDiv);
    });

    // Update bot team scorecard
    botPlayers.forEach((player, index) => {
        const stats = botBatsmenStats[index];
        const playerDiv = document.createElement("div");
        playerDiv.className = "grid grid-cols-12 gap-1 py-1 px-2";
        
        if (index === currentBatsmanIndex && !isUserBatting && !stats.isOut) {
            playerDiv.classList.add("bg-yellow-100", "bg-opacity-10");
        }
        
        // Player name
        const nameSpan = document.createElement("div");
        nameSpan.className = "col-span-6 truncate";
        nameSpan.textContent = player;
        
        // Runs
        const runsSpan = document.createElement("div");
        runsSpan.className = "col-span-2 text-center";
        runsSpan.textContent = stats.runs;
        
        // Balls
        const ballsSpan = document.createElement("div");
        ballsSpan.className = "col-span-2 text-center";
        ballsSpan.textContent = stats.balls;
        
        // Strike Rate
        const srSpan = document.createElement("div");
        srSpan.className = "col-span-2 text-center";
        const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0";
        srSpan.textContent = sr;
        
        // Status indicator
        if (stats.isOut) {
            nameSpan.innerHTML += " <span class='text-red-500'>(out)</span>";
        } else if (index === currentBatsmanIndex && !isUserBatting) {
            nameSpan.innerHTML += " <span class='text-green-500'>*</span>";
        }
        
        playerDiv.appendChild(nameSpan);
        playerDiv.appendChild(runsSpan);
        playerDiv.appendChild(ballsSpan);
        playerDiv.appendChild(srSpan);
        botScorecard.appendChild(playerDiv);
    });

    // Update total scores
    document.getElementById("user-score").textContent = userScore;
    document.getElementById("bot-score").textContent = botScore;
    document.getElementById("user-wickets").textContent = userWickets;
    document.getElementById("bot-wickets").textContent = botWickets;
    document.getElementById("user-total-score").textContent = userScore;
    document.getElementById("bot-total-score").textContent = botScore;
    
    // Update overs - show both teams' overs
    const userOversDisplay = isUserBatting ? 
        `${userBattingOvers}.${ballsInCurrentOver}` : 
        `${userBattingOvers}.0`;
    const botOversDisplay = !isUserBatting ? 
        `${botBattingOvers}.${ballsInCurrentOver}` : 
        `${botBattingOvers}.0`;
    
    document.getElementById("user-overs").textContent = userOversDisplay;
    document.getElementById("bot-overs").textContent = botOversDisplay;
}

// Handle run selection with anti-spam measures
function chooseRun(userRunChoice) {
    if (isInningsOver) return;

    // Track last user choices (we now track 3 choices to detect third repeat)
    lastUserChoices.push(userRunChoice);
    if (lastUserChoices.length > 3) {
        lastUserChoices.shift();
    }

    // Determine bot choice based on spam detection
    let botRunChoice;
    
    // Check if user has made the same choice 3 times in a row
    const isSpamming = lastUserChoices.length === 3 && 
                      lastUserChoices[0] === lastUserChoices[1] && 
                      lastUserChoices[1] === lastUserChoices[2];
    
    if (isSpamming) {
        if (isUserBatting) {
            // When user is batting, match their choice to get them out (on third repeat)
            botRunChoice = userRunChoice;
        } else {
            // When bot is batting, ensure we don't match their spammed choice
            do {
                botRunChoice = Math.floor(Math.random() * 7);
            } while (botRunChoice === userRunChoice);
        }
    } else {
        // Normal random choice (allow two repeats without punishment)
        botRunChoice = Math.floor(Math.random() * 7);
    }

    // Update game state
    ballsBowled++;
    ballsInCurrentOver++;
    
    // Update overs when 6 balls are bowled
    if (ballsInCurrentOver >= 6) {
        if (isUserBatting) {
            userBattingOvers++;
        } else {
            botBattingOvers++;
        }
        ballsInCurrentOver = 0;
    }
    
    // Handle batting logic
    if (isUserBatting) {
        if (userRunChoice === botRunChoice) {
            // Wicket falls when choices match
            userWickets++;
            userBatsmenStats[currentBatsmanIndex].isOut = true;
            userBatsmenStats[currentBatsmanIndex].balls++;
            currentBatsmanIndex++;
            document.getElementById("user-wickets").innerText = userWickets;
            
            // Reset choice history after wicket
            lastUserChoices = [];
            
            if (userWickets === 10 || currentBatsmanIndex >= userPlayers.length) {
                endInnings();
                return;
            }
        } else {
            // No wicket, add runs
            userScore += userRunChoice;
            userBatsmenStats[currentBatsmanIndex].runs += userRunChoice;
            userBatsmenStats[currentBatsmanIndex].balls++;
            document.getElementById("user-score").innerText = userScore;
            
            if (!isFirstInnings && userScore >= target) {
                endInnings();
                return;
            }
        }
    } 
    // Handle bowling logic
    else {
        if (userRunChoice === botRunChoice) {
            // Wicket falls when choices match
            botWickets++;
            botBatsmenStats[currentBatsmanIndex].isOut = true;
            botBatsmenStats[currentBatsmanIndex].balls++;
            currentBatsmanIndex++;
            document.getElementById("bot-wickets").innerText = botWickets;
            
            // Reset choice history after wicket
            lastUserChoices = [];
            
            if (botWickets === 10 || currentBatsmanIndex >= botPlayers.length) {
                endInnings();
                return;
            }
        } else {
            // No wicket, add runs
            botScore += botRunChoice;
            botBatsmenStats[currentBatsmanIndex].runs += botRunChoice;
            botBatsmenStats[currentBatsmanIndex].balls++;
            document.getElementById("bot-score").innerText = botScore;
            
            if (!isFirstInnings && botScore >= target) {
                endInnings();
                return;
            }
        }
    }
    
    updateScorecard();
}
// End innings
function endInnings() {
    isInningsOver = true;
    const resultText = document.getElementById("result-text");
    resultText.classList.remove("hidden");

    if (isFirstInnings) {
        // First innings ended, set target and switch roles
        isFirstInnings = false;
        if (isUserBatting) {
            target = userScore + 1;
            resultText.innerText = `${userTeam} scored ${userScore}. ${botTeam} needs ${target} to win.`;
            isUserBatting = false;
        } else {
            target = botScore + 1;
            resultText.innerText = `${botTeam} scored ${botScore}. ${userTeam} needs ${target} to win.`;
            isUserBatting = true;
        }
        resultText.className = "bg-blue-600 p-4 rounded-lg shadow-lg mb-6 text-center text-xl font-bold";
        
        // Reset for second innings
        currentBatsmanIndex = 0;
        ballsBowled = 0;
        ballsInCurrentOver = 0;
        setTimeout(startInnings, 2000);
    } else {
        // Second innings ended - game over
        if (isUserBatting) {
            if (userScore >= target) {
                resultText.innerText = `${userTeam} wins by ${10 - userWickets} wickets!`;
                resultText.className = "bg-green-600 p-4 rounded-lg shadow-lg mb-6 text-center text-xl font-bold";
            } else {
                resultText.innerText = `${botTeam} wins by ${target - userScore - 1} runs!`;
                resultText.className = "bg-red-600 p-4 rounded-lg shadow-lg mb-6 text-center text-xl font-bold";
            }
        } else {
            if (botScore >= target) {
                resultText.innerText = `${botTeam} wins by ${10 - botWickets} wickets!`;
                resultText.className = "bg-red-600 p-4 rounded-lg shadow-lg mb-6 text-center text-xl font-bold";
            } else {
                resultText.innerText = `${userTeam} wins by ${target - botScore - 1} runs!`;
                resultText.className = "bg-green-600 p-4 rounded-lg shadow-lg mb-6 text-center text-xl font-bold";
            }
        }
    }
}