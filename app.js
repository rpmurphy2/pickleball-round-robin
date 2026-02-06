// Pickleball Round Robin Generator
// Handles doubles tournament scheduling with round assignment

class PickleballRoundRobin {
    constructor() {
        this.teams = [];
        this.numCourts = 2;
        this.schedule = [];
        this.manualRounds = [];

        this.init();
    }

    init() {
        // DOM elements - Setup
        this.numCourtsInput = document.getElementById('numCourts');
        this.teamsListEl = document.getElementById('teamsList');
        this.player1Input = document.getElementById('player1');
        this.player2Input = document.getElementById('player2');
        this.addTeamBtn = document.getElementById('addTeamBtn');
        this.quickAddTextarea = document.getElementById('quickAddTeams');
        this.quickAddBtn = document.getElementById('quickAddBtn');
        this.generateBtn = document.getElementById('generateBtn');

        // DOM elements - Manual Setup
        this.manualSetupSection = document.getElementById('manualSetupSection');
        this.manualRoundsContainer = document.getElementById('manualRoundsContainer');
        this.addManualRoundBtn = document.getElementById('addManualRoundBtn');
        this.completeScheduleBtn = document.getElementById('completeScheduleBtn');
        this.skipManualBtn = document.getElementById('skipManualBtn');

        // DOM elements - Schedule
        this.scheduleSection = document.getElementById('scheduleSection');
        this.scheduleOutput = document.getElementById('scheduleOutput');
        this.summarySection = document.getElementById('summarySection');
        this.printBtn = document.getElementById('printBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.regenerateBtn = document.getElementById('regenerateBtn');

        // Event listeners - Setup
        this.addTeamBtn.addEventListener('click', () => this.addTeam());
        this.quickAddBtn.addEventListener('click', () => this.quickAddTeams());
        this.generateBtn.addEventListener('click', () => this.showManualSetup());

        // Event listeners - Manual Setup
        this.addManualRoundBtn.addEventListener('click', () => this.addManualRound());
        this.completeScheduleBtn.addEventListener('click', () => this.generateSchedule());
        this.skipManualBtn.addEventListener('click', () => this.generateSchedule(true));

        // Event listeners - Schedule
        this.printBtn.addEventListener('click', () => window.print());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.regenerateBtn.addEventListener('click', () => this.regenerateWithAssignments());

        // Allow Enter key to add team
        this.player2Input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTeam();
        });

        // Load saved teams if any
        this.loadFromStorage();
    }

    // ==================== TEAM MANAGEMENT ====================

    addTeam() {
        const player1 = this.player1Input.value.trim();
        const player2 = this.player2Input.value.trim();

        if (!player1 || !player2) {
            alert('Please enter both player names');
            return;
        }

        this.teams.push({
            id: this.teams.length + 1,
            player1,
            player2,
            name: `${player1} & ${player2}`
        });

        this.player1Input.value = '';
        this.player2Input.value = '';
        this.player1Input.focus();

        this.renderTeams();
        this.saveToStorage();
    }

    quickAddTeams() {
        const text = this.quickAddTextarea.value.trim();
        if (!text) return;

        const lines = text.split('\n');
        let addedCount = 0;

        lines.forEach(line => {
            const parts = line.split(',').map(p => p.trim());
            if (parts.length >= 2 && parts[0] && parts[1]) {
                this.teams.push({
                    id: this.teams.length + 1,
                    player1: parts[0],
                    player2: parts[1],
                    name: `${parts[0]} & ${parts[1]}`
                });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            this.quickAddTextarea.value = '';
            this.renderTeams();
            this.saveToStorage();
        } else {
            alert('No valid teams found. Use format: Player1, Player2 (one team per line)');
        }
    }

    removeTeam(index) {
        this.teams.splice(index, 1);
        this.teams.forEach((team, i) => {
            team.id = i + 1;
        });
        this.renderTeams();
        this.saveToStorage();
    }

    renderTeams() {
        if (this.teams.length === 0) {
            this.teamsListEl.innerHTML = '<p style="color: #999; margin: 0;">No teams added yet</p>';
            return;
        }

        this.teamsListEl.innerHTML = this.teams.map((team, index) => `
            <div class="team-tag">
                <span class="team-number">T${team.id}</span>
                <span>${team.name}</span>
                <button class="remove-team" onclick="app.removeTeam(${index})">&times;</button>
            </div>
        `).join('');
    }

    // ==================== MANUAL SETUP ====================

    showManualSetup() {
        if (this.teams.length < 2) {
            alert('Please add at least 2 teams');
            return;
        }

        this.numCourts = parseInt(this.numCourtsInput.value) || 2;
        this.manualRounds = [];
        this.renderManualRounds();
        this.manualSetupSection.classList.remove('hidden');
        this.manualSetupSection.scrollIntoView({ behavior: 'smooth' });
    }

    addManualRound() {
        const roundNum = this.manualRounds.length + 1;
        this.manualRounds.push({
            roundNumber: roundNum,
            matches: []
        });
        this.renderManualRounds();
    }

    removeManualRound(roundIndex) {
        this.manualRounds.splice(roundIndex, 1);
        this.manualRounds.forEach((round, i) => {
            round.roundNumber = i + 1;
        });
        this.renderManualRounds();
    }

    addManualMatch(roundIndex) {
        this.manualRounds[roundIndex].matches.push({
            team1Id: null,
            team2Id: null
        });
        this.renderManualRounds();
    }

    removeManualMatch(roundIndex, matchIndex) {
        this.manualRounds[roundIndex].matches.splice(matchIndex, 1);
        this.renderManualRounds();
    }

    updateManualMatch(roundIndex, matchIndex, side, teamId) {
        const match = this.manualRounds[roundIndex].matches[matchIndex];
        if (side === 'team1') {
            match.team1Id = teamId ? parseInt(teamId) : null;
        } else {
            match.team2Id = teamId ? parseInt(teamId) : null;
        }
    }

    renderManualRounds() {
        if (this.manualRounds.length === 0) {
            this.manualRoundsContainer.innerHTML = `
                <p style="color: #666; text-align: center; padding: 20px;">
                    No manual rounds added yet. Click "Add Manual Round" to lock in specific matchups,<br>
                    or click "Skip - Auto Generate All" to let the system create the entire schedule.
                </p>
            `;
            return;
        }

        this.manualRoundsContainer.innerHTML = this.manualRounds.map((round, roundIndex) => `
            <div class="manual-round ${round.matches.length > 0 ? 'has-matches' : ''}">
                <div class="manual-round-header">
                    <h3>Round ${round.roundNumber}</h3>
                    <button class="remove-round-btn" onclick="app.removeManualRound(${roundIndex})">Remove Round</button>
                </div>
                <div class="manual-matches-list">
                    ${round.matches.map((match, matchIndex) => this.renderManualMatchRow(roundIndex, matchIndex, match)).join('')}
                </div>
                <button class="add-match-btn" onclick="app.addManualMatch(${roundIndex})">+ Add Match</button>
            </div>
        `).join('');
    }

    renderManualMatchRow(roundIndex, matchIndex, match) {
        const teamOptions = this.teams.map(team =>
            `<option value="${team.id}">${team.name}</option>`
        ).join('');

        return `
            <div class="manual-match">
                <select onchange="app.updateManualMatch(${roundIndex}, ${matchIndex}, 'team1', this.value)">
                    <option value="">Select Team 1</option>
                    ${teamOptions}
                </select>
                <span class="vs">VS</span>
                <select onchange="app.updateManualMatch(${roundIndex}, ${matchIndex}, 'team2', this.value)">
                    <option value="">Select Team 2</option>
                    ${teamOptions}
                </select>
                <button class="remove-match-btn" onclick="app.removeManualMatch(${roundIndex}, ${matchIndex})">&times;</button>
            </div>
        `;
    }

    // ==================== SCHEDULE GENERATION ====================

    generateSchedule(skipManual = false) {
        this.numCourts = parseInt(this.numCourtsInput.value) || 2;

        if (this.teams.length < 2) {
            alert('Please add at least 2 teams');
            return;
        }

        const lockedMatchups = skipManual ? [] : this.getLockedMatchups();

        const validationError = this.validateLockedMatchups(lockedMatchups);
        if (validationError) {
            alert(validationError);
            return;
        }

        this.schedule = this.createScheduleWithLockedMatchups(lockedMatchups);

        if (!this.schedule) {
            alert('Unable to generate a valid schedule with the given manual matchups. Please adjust your manual rounds.');
            return;
        }

        this.assignCourts();
        this.renderSchedule();
        this.renderSummary();

        this.manualSetupSection.classList.add('hidden');
        this.scheduleSection.classList.remove('hidden');
        this.scheduleSection.scrollIntoView({ behavior: 'smooth' });
    }

    regenerateWithAssignments() {
        // Build locked matchups from matches that have been assigned to specific rounds
        const lockedMatchups = [];

        // Collect assigned byes
        const assignedByes = {};
        this.schedule.forEach(round => {
            if (round.assignedBye !== null && round.assignedBye !== undefined) {
                assignedByes[round.roundNumber] = round.assignedBye;
            }
        });

        this.schedule.forEach(round => {
            const assignedInRound = round.matches
                .filter(m => m.assignedRound !== null && m.assignedRound !== undefined)
                .map(m => ({
                    team1Id: m.team1.id,
                    team2Id: m.team2.id,
                    assignedRound: m.assignedRound
                }));

            assignedInRound.forEach(match => {
                let targetRound = lockedMatchups.find(r => r.roundNumber === match.assignedRound);
                if (!targetRound) {
                    targetRound = { roundNumber: match.assignedRound, matches: [] };
                    lockedMatchups.push(targetRound);
                }
                targetRound.matches.push({
                    team1Id: match.team1Id,
                    team2Id: match.team2Id
                });
            });
        });

        // Sort by round number
        lockedMatchups.sort((a, b) => a.roundNumber - b.roundNumber);

        const validationError = this.validateLockedMatchups(lockedMatchups);
        if (validationError) {
            alert(validationError);
            return;
        }

        this.schedule = this.createScheduleWithLockedMatchups(lockedMatchups, assignedByes);

        if (!this.schedule) {
            alert('Unable to generate a valid schedule. Please adjust your round assignments.');
            return;
        }

        this.assignCourts();
        this.renderSchedule();
        this.renderSummary();
    }

    getLockedMatchups() {
        const locked = [];

        this.manualRounds.forEach(round => {
            const roundMatchups = [];
            round.matches.forEach(match => {
                if (match.team1Id && match.team2Id && match.team1Id !== match.team2Id) {
                    roundMatchups.push({
                        team1Id: match.team1Id,
                        team2Id: match.team2Id
                    });
                }
            });
            if (roundMatchups.length > 0) {
                locked.push({
                    roundNumber: round.roundNumber,
                    matches: roundMatchups
                });
            }
        });

        return locked;
    }

    validateLockedMatchups(lockedMatchups) {
        const seenMatchups = new Set();

        for (const round of lockedMatchups) {
            const teamsInRound = new Set();

            for (const match of round.matches) {
                if (teamsInRound.has(match.team1Id) || teamsInRound.has(match.team2Id)) {
                    return `Round ${round.roundNumber}: A team cannot play multiple matches in the same round.`;
                }
                teamsInRound.add(match.team1Id);
                teamsInRound.add(match.team2Id);

                const matchupKey = [match.team1Id, match.team2Id].sort().join('-');
                if (seenMatchups.has(matchupKey)) {
                    const team1 = this.teams.find(t => t.id === match.team1Id);
                    const team2 = this.teams.find(t => t.id === match.team2Id);
                    return `Duplicate matchup: ${team1.name} vs ${team2.name} appears more than once.`;
                }
                seenMatchups.add(matchupKey);
            }
        }

        return null;
    }

    createScheduleWithLockedMatchups(lockedMatchups, assignedByes = {}) {
        const n = this.teams.length;
        const totalRounds = n % 2 === 0 ? n - 1 : n;
        const matchesPerRound = Math.floor(n / 2);

        // Build list of all possible matchups
        const allMatchups = [];
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                allMatchups.push({
                    key: `${this.teams[i].id}-${this.teams[j].id}`,
                    team1: this.teams[i],
                    team2: this.teams[j]
                });
            }
        }

        // Create a map of round -> locked matches for that round
        const lockedByRound = new Map();
        const lockedKeys = new Set();

        lockedMatchups.forEach(lr => {
            const matches = lr.matches.map(m => {
                const key = [m.team1Id, m.team2Id].sort().join('-');
                lockedKeys.add(key);
                return {
                    key,
                    team1: this.teams.find(t => t.id === m.team1Id),
                    team2: this.teams.find(t => t.id === m.team2Id)
                };
            });
            lockedByRound.set(lr.roundNumber, matches);
        });

        // Initialize the schedule structure
        // Each round tracks: matches placed, teams used in this round
        const rounds = [];
        for (let roundNum = 1; roundNum <= totalRounds; roundNum++) {
            const assignedByeTeamId = assignedByes[roundNum] || null;
            rounds.push({
                roundNumber: roundNum,
                matches: [],
                teamsUsed: new Set(),
                hasAssignedMatches: false,
                assignedBye: assignedByeTeamId
            });
            // If there's an assigned bye, mark that team as "used" so they can't be scheduled
            if (assignedByeTeamId) {
                rounds[roundNum - 1].teamsUsed.add(assignedByeTeamId);
            }
        }

        // Place all locked matches first
        for (let roundNum = 1; roundNum <= totalRounds; roundNum++) {
            const lockedMatches = lockedByRound.get(roundNum) || [];
            const round = rounds[roundNum - 1];

            for (const match of lockedMatches) {
                round.teamsUsed.add(match.team1.id);
                round.teamsUsed.add(match.team2.id);
                round.matches.push({
                    team1: match.team1,
                    team2: match.team2,
                    assignedRound: roundNum
                });
                round.hasAssignedMatches = true;
            }
        }

        // Get remaining matchups that need to be placed
        const remainingMatchups = allMatchups.filter(m => !lockedKeys.has(m.key));

        // Use backtracking to place remaining matchups
        const placedKeys = new Set(lockedKeys);

        const canPlaceInRound = (match, round) => {
            if (round.matches.length >= matchesPerRound) return false;
            if (round.teamsUsed.has(match.team1.id)) return false;
            if (round.teamsUsed.has(match.team2.id)) return false;
            return true;
        };

        const placeMatch = (match, round) => {
            round.matches.push({
                team1: match.team1,
                team2: match.team2,
                assignedRound: null
            });
            round.teamsUsed.add(match.team1.id);
            round.teamsUsed.add(match.team2.id);
            placedKeys.add(match.key);
        };

        const removeMatch = (match, round) => {
            const idx = round.matches.findIndex(m =>
                m.team1.id === match.team1.id && m.team2.id === match.team2.id && m.assignedRound === null
            );
            if (idx !== -1) {
                round.matches.splice(idx, 1);
                // Only remove from teamsUsed if no other match in this round uses these teams
                const stillUsed1 = round.matches.some(m => m.team1.id === match.team1.id || m.team2.id === match.team1.id);
                const stillUsed2 = round.matches.some(m => m.team1.id === match.team2.id || m.team2.id === match.team2.id);
                if (!stillUsed1) round.teamsUsed.delete(match.team1.id);
                if (!stillUsed2) round.teamsUsed.delete(match.team2.id);
                placedKeys.delete(match.key);
            }
        };

        // Backtracking solver
        const solve = (matchIndex) => {
            if (matchIndex >= remainingMatchups.length) {
                // Check if all rounds are full
                return rounds.every(r => r.matches.length === matchesPerRound);
            }

            const match = remainingMatchups[matchIndex];

            // Try placing this match in each round
            for (let roundNum = 1; roundNum <= totalRounds; roundNum++) {
                const round = rounds[roundNum - 1];

                if (canPlaceInRound(match, round)) {
                    placeMatch(match, round);

                    if (solve(matchIndex + 1)) {
                        return true;
                    }

                    removeMatch(match, round);
                }
            }

            return false;
        };

        // First try a greedy approach - it works in most cases and is fast
        const greedySuccess = this.greedyFill(remainingMatchups.slice(), rounds, matchesPerRound, totalRounds);

        if (!greedySuccess) {
            // Reset non-locked matches and try backtracking
            for (const round of rounds) {
                round.matches = round.matches.filter(m => m.assignedRound !== null);
                round.teamsUsed = new Set();
                round.matches.forEach(m => {
                    round.teamsUsed.add(m.team1.id);
                    round.teamsUsed.add(m.team2.id);
                });
            }
            placedKeys.clear();
            lockedKeys.forEach(k => placedKeys.add(k));

            // Sort remaining matchups to improve backtracking efficiency
            // Prioritize matchups involving teams that are already constrained
            remainingMatchups.sort((a, b) => {
                const aConstraints = this.countConstraints(a, rounds, totalRounds);
                const bConstraints = this.countConstraints(b, rounds, totalRounds);
                return aConstraints - bConstraints; // Most constrained first
            });

            if (!solve(0)) {
                console.error('Backtracking failed to find valid schedule');
                return null;
            }
        }

        // Build final schedule
        const schedule = rounds.map(round => ({
            roundNumber: round.roundNumber,
            matches: round.matches,
            byeTeam: null,
            hasAssignedMatches: round.hasAssignedMatches,
            assignedBye: round.assignedBye
        }));

        // Determine bye teams for odd number of teams
        if (n % 2 !== 0) {
            for (const round of schedule) {
                const teamsUsed = new Set();
                round.matches.forEach(m => {
                    teamsUsed.add(m.team1.id);
                    teamsUsed.add(m.team2.id);
                });
                for (const team of this.teams) {
                    if (!teamsUsed.has(team.id)) {
                        round.byeTeam = team;
                        break;
                    }
                }
            }
        }

        return schedule;
    }

    // Helper to count how many rounds a match can potentially go in
    countConstraints(match, rounds, totalRounds) {
        let validRounds = 0;
        for (let i = 0; i < totalRounds; i++) {
            const round = rounds[i];
            if (round.matches.length < Math.floor(this.teams.length / 2) &&
                !round.teamsUsed.has(match.team1.id) &&
                !round.teamsUsed.has(match.team2.id)) {
                validRounds++;
            }
        }
        return validRounds;
    }

    // Greedy fill - tries to fill rounds intelligently
    greedyFill(matchups, rounds, matchesPerRound, totalRounds) {
        // Multiple strategies to try
        const strategies = [
            // Strategy 1: Fill rounds that need matches most urgently first
            () => {
                let placed = true;
                while (placed && matchups.length > 0) {
                    placed = false;

                    // Sort rounds by how many more matches they need (most urgent first)
                    // But also consider rounds with more constraints
                    const roundOrder = [...Array(totalRounds).keys()]
                        .map(i => ({
                            index: i,
                            need: matchesPerRound - rounds[i].matches.length,
                            options: this.countOptionsForRound(rounds[i], matchups)
                        }))
                        .filter(r => r.need > 0)
                        .sort((a, b) => {
                            // Prioritize rounds with fewer options (more constrained)
                            if (a.options !== b.options) return a.options - b.options;
                            return b.need - a.need;
                        });

                    for (const { index } of roundOrder) {
                        const round = rounds[index];
                        if (round.matches.length >= matchesPerRound) continue;

                        // Find best match for this round (one with fewest other placement options)
                        let bestMatch = null;
                        let bestMatchIndex = -1;
                        let bestOptions = Infinity;

                        for (let i = 0; i < matchups.length; i++) {
                            const match = matchups[i];
                            if (!round.teamsUsed.has(match.team1.id) && !round.teamsUsed.has(match.team2.id)) {
                                const options = this.countMatchOptions(match, rounds, matchesPerRound);
                                if (options < bestOptions) {
                                    bestOptions = options;
                                    bestMatch = match;
                                    bestMatchIndex = i;
                                }
                            }
                        }

                        if (bestMatch) {
                            round.matches.push({
                                team1: bestMatch.team1,
                                team2: bestMatch.team2,
                                assignedRound: null
                            });
                            round.teamsUsed.add(bestMatch.team1.id);
                            round.teamsUsed.add(bestMatch.team2.id);
                            matchups.splice(bestMatchIndex, 1);
                            placed = true;
                            break;
                        }
                    }
                }
                return matchups.length === 0 && rounds.every(r => r.matches.length === matchesPerRound);
            }
        ];

        for (const strategy of strategies) {
            if (strategy()) return true;
        }

        return false;
    }

    countOptionsForRound(round, matchups) {
        let count = 0;
        for (const match of matchups) {
            if (!round.teamsUsed.has(match.team1.id) && !round.teamsUsed.has(match.team2.id)) {
                count++;
            }
        }
        return count;
    }

    countMatchOptions(match, rounds, matchesPerRound) {
        let count = 0;
        for (const round of rounds) {
            if (round.matches.length < matchesPerRound &&
                !round.teamsUsed.has(match.team1.id) &&
                !round.teamsUsed.has(match.team2.id)) {
                count++;
            }
        }
        return count;
    }

    assignCourts() {
        this.schedule.forEach(round => {
            round.matches.forEach((match, index) => {
                match.court = (index % this.numCourts) + 1;
            });
        });
    }

    // ==================== ROUND ASSIGNMENT ====================

    assignMatchToRound(currentRoundIndex, matchIndex, newRoundNum) {
        const match = this.schedule[currentRoundIndex].matches[matchIndex];

        if (newRoundNum === '') {
            // Clear assignment
            match.assignedRound = null;
        } else {
            const targetRound = parseInt(newRoundNum);

            // Check if this would create a conflict with other ASSIGNED matches in target round
            const conflictingAssignments = [];
            this.schedule.forEach(round => {
                round.matches.forEach(m => {
                    if (m !== match && m.assignedRound === targetRound) {
                        if (m.team1.id === match.team1.id || m.team1.id === match.team2.id ||
                            m.team2.id === match.team1.id || m.team2.id === match.team2.id) {
                            conflictingAssignments.push(m);
                        }
                    }
                });
            });

            if (conflictingAssignments.length > 0) {
                const conflictTeams = conflictingAssignments.map(m => `${m.team1.name} vs ${m.team2.name}`).join(', ');
                alert(`Cannot assign to Round ${targetRound}: One of the teams is already assigned to play in that round (${conflictTeams}).`);
                this.renderSchedule(); // Re-render to reset the dropdown
                return;
            }

            match.assignedRound = targetRound;
        }

        // Update hasAssignedMatches flags
        this.schedule.forEach(round => {
            round.hasAssignedMatches = round.matches.some(m => m.assignedRound !== null);
        });

        this.renderSchedule();
        this.updateRegenerateButton();
    }

    updateRegenerateButton() {
        const hasAssignedMatches = this.schedule.some(r => r.matches.some(m => m.assignedRound !== null));
        const hasAssignedByes = this.schedule.some(r => r.assignedBye !== null && r.assignedBye !== undefined);
        const hasAssignments = hasAssignedMatches || hasAssignedByes;
        this.regenerateBtn.disabled = !hasAssignments;
        this.regenerateBtn.title = hasAssignments
            ? 'Regenerate schedule with your round assignments'
            : 'Assign matches to specific rounds or byes first using the dropdowns';
    }

    // ==================== BYE ASSIGNMENT ====================

    assignByeToRound(roundIndex, teamId) {
        const round = this.schedule[roundIndex];

        if (teamId === '') {
            // Clear assignment
            round.assignedBye = null;
        } else {
            const newByeTeamId = parseInt(teamId);

            // Check if this team is already assigned as bye in another round
            for (let i = 0; i < this.schedule.length; i++) {
                if (i !== roundIndex && this.schedule[i].assignedBye === newByeTeamId) {
                    const team = this.teams.find(t => t.id === newByeTeamId);
                    alert(`${team.name} is already assigned as bye in Round ${i + 1}. A team can only have one bye per tournament.`);
                    this.renderSchedule();
                    return;
                }
            }

            // Check if this team has an assigned match in this round
            const hasAssignedMatchInRound = this.schedule.some(r =>
                r.matches.some(m =>
                    m.assignedRound === round.roundNumber &&
                    (m.team1.id === newByeTeamId || m.team2.id === newByeTeamId)
                )
            );

            if (hasAssignedMatchInRound) {
                const team = this.teams.find(t => t.id === newByeTeamId);
                alert(`${team.name} has an assigned match in Round ${round.roundNumber}. Cannot assign bye.`);
                this.renderSchedule();
                return;
            }

            round.assignedBye = newByeTeamId;
        }

        this.renderSchedule();
        this.updateRegenerateButton();
    }

    // ==================== RENDERING ====================

    renderSchedule() {
        const n = this.teams.length;
        const totalRounds = n % 2 === 0 ? n - 1 : n;
        const hasOddTeams = n % 2 !== 0;

        this.scheduleOutput.innerHTML = this.schedule.map((round, roundIndex) => `
            <div class="round ${round.hasAssignedMatches || round.assignedBye ? 'has-assignments' : ''}">
                <div class="round-header">
                    <h3>Round ${round.roundNumber}${(round.hasAssignedMatches || round.assignedBye) ? '<span class="assigned-badge">Has Assignments</span>' : ''}</h3>
                    ${hasOddTeams && round.byeTeam ? `
                        <div class="bye-selector">
                            <label>Bye:</label>
                            <select onchange="app.assignByeToRound(${roundIndex}, this.value)"
                                    title="Assign which team gets a bye this round">
                                <option value="">Auto (${round.byeTeam.name})</option>
                                ${this.teams.map(team =>
                                    `<option value="${team.id}" ${round.assignedBye === team.id ? 'selected' : ''}>${team.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <span class="bye-print-text">Bye: ${round.byeTeam.name}</span>
                    ` : ''}
                </div>
                <div class="matches">
                    ${round.matches.map((match, matchIndex) => `
                        <div class="match ${match.assignedRound !== null ? 'match-assigned' : ''}">
                            <div class="round-selector">
                                <label>Round:</label>
                                <select onchange="app.assignMatchToRound(${roundIndex}, ${matchIndex}, this.value)"
                                        title="Assign this match to a specific round">
                                    <option value="">Auto</option>
                                    ${Array.from({length: totalRounds}, (_, i) => i + 1).map(r =>
                                        `<option value="${r}" ${match.assignedRound === r ? 'selected' : ''}>R${r}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <span class="court-badge">Court ${match.court}</span>
                            <div class="match-teams">
                                <span class="team-name">${match.team1.name}</span>
                                <span class="vs">VS</span>
                                <span class="team-name">${match.team2.name}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        this.updateRegenerateButton();
    }

    renderSummary() {
        const totalMatches = this.schedule.reduce((sum, round) => sum + round.matches.length, 0);
        const matchesPerTeam = this.teams.length - 1;

        this.summarySection.innerHTML = `
            <h3>Tournament Summary</h3>
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>Players</th>
                        <th>Matches</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.teams.map(team => `
                        <tr>
                            <td><strong>Team ${team.id}</strong></td>
                            <td>${team.name}</td>
                            <td>${matchesPerTeam}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <p style="margin-top: 16px; color: #666;">
                <strong>Total Rounds:</strong> ${this.schedule.length} |
                <strong>Total Matches:</strong> ${totalMatches} |
                <strong>Courts Used:</strong> ${this.numCourts}
            </p>
            <p style="margin-top: 8px; color: #888; font-size: 0.9rem;">
                To move a match to a different round: use the "Round" dropdown to assign it, then click "Regenerate Schedule".
            </p>
        `;
    }

    // ==================== UTILITIES ====================

    reset() {
        if (confirm('Are you sure you want to reset the schedule?')) {
            this.schedule = [];
            this.manualRounds = [];
            this.scheduleSection.classList.add('hidden');
            this.manualSetupSection.classList.add('hidden');
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('pickleballTeams', JSON.stringify(this.teams));
        } catch (e) {
            // Storage not available
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('pickleballTeams');
            if (saved) {
                this.teams = JSON.parse(saved);
                this.renderTeams();
            }
        } catch (e) {
            // Storage not available or invalid data
        }
    }
}

// Initialize app
const app = new PickleballRoundRobin();
