/**
 * ============================================
 * MAIN ENTRY POINT (index.js)
 * ============================================
 *
 * This file is the starting point of your application.
 * It handles:
 * - Getting DOM elements
 * - Form validation
 * - Starting the quiz
 * - Loading/error states
 *
 * DOM ELEMENTS TO GET:
 * - quizOptionsForm: #quizOptions
 * - playerNameInput: #playerName
 * - categoryInput: #categoryMenu
 * - difficultyOptions: #difficultyOptions
 * - questionsNumber: #questionsNumber
 * - startQuizBtn: #startQuiz
 * - questionsContainer: .questions-container
 *
 * FUNCTIONS TO IMPLEMENT:
 * - showLoading() - Display loading spinner
 * - hideLoading() - Remove loading spinner
 * - showError(message) - Display error card
 * - validateForm() - Check if form is valid
 * - showFormError(message) - Show error on form
 * - resetToStart() - Reset to initial state
 * - startQuiz() - Main function to start quiz
 */

// ============================================
// TODO: Get DOM Element References
// ============================================
// Use document.getElementById() and document.querySelector()

// ============================================
// TODO: Create variable to store current quiz
// ============================================
// let currentQuiz = null;

// ============================================
// TODO: Create showLoading() function
// ============================================
// Set questionsContainer.innerHTML to loading HTML
// See index.html for the HTML structure

// ============================================
// TODO: Create hideLoading() function
// ============================================
// Find and remove the loading overlay

// ============================================
// TODO: Create showError(message) function
// ============================================
// Set questionsContainer.innerHTML to error HTML
// Include the message parameter in the display
// Add click listener to retry button that calls resetToStart()

// ============================================
// TODO: Create validateForm() function
// ============================================
// Return object: { isValid: boolean, error: string | null }
// Check:
// 1. questionsNumber has a value
// 2. Value is >= 1 (minimum questions)
// 3. Value is <= 50 (maximum questions)

// ============================================
// TODO: Create showFormError(message) function
// ============================================
// Create error div with class 'form-error'
// Insert before the start button
// Remove after 3 seconds with fade effect

// ============================================
// TODO: Create resetToStart() function
// ============================================
// 1. Clear questionsContainer
// 2. Reset form values
// 3. Show the form (remove 'hidden' class)
// 4. Set currentQuiz = null

// ============================================
// TODO: Create async startQuiz() function
// ============================================
// This is the main function, called when Start button is clicked
//
// Steps:
// 1. Validate the form
// 2. If not valid, show error and return
// 3. Get form values:
//    - playerName (use 'Player' if empty)
//    - category
//    - difficulty
//    - numberOfQuestions
// 4. Create new Quiz instance
// 5. Hide the form (add 'hidden' class)
// 6. Show loading spinner
// 7. Try to fetch questions:
//    - await currentQuiz.getQuestions()
//    - Hide loading
//    - Check if questions exist
//    - Create first Question and display it
// 8. Catch any errors:
//    - Hide loading
//    - Show error message

// ============================================
// TODO: Add Event Listeners
// ============================================
// 1. startQuizBtn click -> call startQuiz()
// 2. questionsNumber keydown -> if Enter, call startQuiz()

const API_URL = "https://opentdb.com/api.php";
const QUESTION_TIME = 15;
const LEADERBOARD_KEY = "quizLeaderboard";

function decodeHTML(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [result[i], result[randomIndex]] = [result[randomIndex], result[i]];
  }

  return result;
}

class Question {
  constructor(data) {
    this.text = decodeHTML(data.question);
    this.correctAnswer = decodeHTML(data.correct_answer);
    this.incorrectAnswers = data.incorrect_answers.map(decodeHTML);
    this.type = data.type;
    this.category = decodeHTML(data.category);
    this.difficulty = data.difficulty;

    this.answers = shuffle([this.correctAnswer, ...this.incorrectAnswers]);
  }
}

class Timer {
  constructor(onTick, onFinish) {
    this.onTick = onTick;
    this.onFinish = onFinish;
    this.timeLeft = QUESTION_TIME;
    this.intervalId = null;
  }

  start() {
    this.stop();
    this.timeLeft = QUESTION_TIME;
    this.onTick(this.timeLeft);

    this.intervalId = setInterval(() => {
      this.timeLeft--;
      this.onTick(this.timeLeft);

      if (this.timeLeft <= 0) {
        this.stop();
        this.onFinish();
      }
    }, 1000);
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

class SoundManager {
  play(isCorrect) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    try {
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.type = "sine";
      oscillator.frequency.value = isCorrect ? 660 : 220;

      gain.gain.setValueAtTime(0.12, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.25,
      );

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.25);

      oscillator.onended = () => audioContext.close();
    } catch (error) {
      console.warn("Sound could not be played:", error);
    }
  }
}

class Quiz {
  constructor(questions) {
    this.questions = questions;
    this.currentIndex = 0;
    this.score = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
  }

  get currentQuestion() {
    return this.questions[this.currentIndex];
  }

  get totalQuestions() {
    return this.questions.length;
  }

  checkAnswer(answer) {
    const isCorrect = answer === this.currentQuestion.correctAnswer;

    if (isCorrect) {
      this.score++;
      this.correctCount++;
    } else {
      this.wrongCount++;
    }

    return isCorrect;
  }

  nextQuestion() {
    this.currentIndex++;
    return this.currentIndex < this.totalQuestions;
  }
}

class QuizApp {
  constructor() {
    this.setupForm = document.getElementById("quizOptions");
    this.startButton = document.getElementById("startQuiz");
    this.questionsContainer = document.getElementById("questionsContainer");

    this.playerNameInput = document.getElementById("playerName");
    this.categorySelect = document.getElementById("categorySelect");
    this.categoryInput = document.getElementById("categoryMenu");
    this.difficultySelect = document.getElementById("difficultySelect");
    this.difficultyInput = document.getElementById("difficultyOptions");
    this.questionsNumberInput = document.getElementById("questionsNumber");

    this.quiz = null;

    this.timer = new Timer(
      (time) => this.updateTimer(time),
      () => this.handleAnswer(null),
    );

    this.soundManager = new SoundManager();

    this.isAnswering = false;
    this.advanceTimeout = null;
    this.lastSettings = null;

    this.bindEvents();
  }

  bindEvents() {
    this.startButton.addEventListener("click", () => {
      this.startGame();
    });

    this.setupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this.startGame();
    });

    this.questionsContainer.addEventListener("click", (event) => {
      const answerButton = event.target.closest(".answer-btn");

      if (answerButton) {
        this.handleAnswer(answerButton.dataset.answer);
        return;
      }

      if (
        event.target.closest(".play-again-btn") ||
        event.target.closest(".retry-btn")
      ) {
        this.resetToSetup();
        return;
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!this.quiz || this.isAnswering) return;

      const tagName = event.target.tagName;

      if (["INPUT", "TEXTAREA", "SELECT"].includes(tagName)) {
        return;
      }

      if (!/^[1-4]$/.test(event.key)) return;

      const answerButtons = this.questionsContainer.querySelectorAll(
        ".answer-btn:not(:disabled)",
      );

      const selectedButton = answerButtons[Number(event.key) - 1];

      if (selectedButton) {
        this.handleAnswer(selectedButton.dataset.answer);
      }
    });
  }

  getSettings() {
    const amount = Number(this.questionsNumberInput.value);

    const playerName = this.playerNameInput.value.trim() || "Player";

    const category = this.categorySelect.dataset.value || "";

    const difficulty = this.difficultySelect.dataset.value || "easy";

    if (!Number.isInteger(amount) || amount < 1 || amount > 50) {
      this.showFormError("Please choose a number between 1 and 50.");

      this.questionsNumberInput.focus();
      return null;
    }

    this.clearFormError();

    return {
      amount,
      playerName,
      category,
      difficulty,
    };
  }

  async startGame() {
    const settings = this.getSettings();

    if (!settings) return;

    this.lastSettings = settings;

    this.timer.stop();
    clearTimeout(this.advanceTimeout);

    this.quiz = null;
    this.isAnswering = false;

    this.showLoading();

    try {
      const questionsData = await this.fetchQuestions(settings);

      const questions = questionsData.map((item) => new Question(item));

      if (!questions.length) {
        throw new Error("No questions were returned.");
      }

      this.quiz = new Quiz(questions);
      this.renderQuestion();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async fetchQuestions(settings) {
    const params = new URLSearchParams({
      amount: settings.amount,
      difficulty: settings.difficulty,
    });

    if (settings.category) {
      params.set("category", settings.category);
    }

    const response = await fetch(`${API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Could not connect to the API.");
    }

    const data = await response.json();

    if (data.response_code === 1) {
      throw new Error(
        "Not enough questions. Try another category or fewer questions.",
      );
    }

    if (data.response_code === 5) {
      throw new Error("Too many requests. Please wait and try again.");
    }

    if (data.response_code !== 0) {
      throw new Error("Something went wrong with the API.");
    }

    return data.results;
  }

  showLoading() {
    this.setupForm.hidden = true;

    this.questionsContainer.innerHTML = `
            <div class="loading-container">
                <div class="loader"></div>
                <p>Loading questions...</p>
            </div>
        `;
  }

  renderQuestion() {
    this.isAnswering = false;

    const question = this.quiz.currentQuestion;
    const questionNumber = this.quiz.currentIndex + 1;
    const totalQuestions = this.quiz.totalQuestions;

    const answersHTML = question.answers
      .map(
        (answer, index) => `
            <button
                type="button"
                class="answer-btn"
                data-answer="${escapeHTML(answer)}"
            >
                <span class="answer-number">${index + 1}</span>
                <span>${escapeHTML(answer)}</span>
            </button>
        `,
      )
      .join("");

    this.questionsContainer.innerHTML = `
            <div class="question-card">

                <div class="question-header">
                    <span class="question-count">
                        Question ${questionNumber} / ${totalQuestions}
                    </span>

                    <span class="stat-badge timer">
                        <span class="timer-value">15</span>s
                    </span>
                </div>

                <div class="progress-track">
                    <div
                        class="progress-fill"
                        style="width: ${(questionNumber / totalQuestions) * 100}%"
                    ></div>
                </div>

                <div class="question-info">
                    <span>${escapeHTML(question.category)}</span>

                    <span class="difficulty-badge ${question.difficulty}">
                        ${escapeHTML(question.difficulty)}
                    </span>
                </div>

                <h2 class="question-text">
                    ${escapeHTML(question.text)}
                </h2>

                <div class="answers-grid">
                    ${answersHTML}
                </div>

                <div class="question-footer">
                    <span>Score: ${this.quiz.score}</span>
                    <span>Choose your answer</span>
                </div>

            </div>
        `;

    this.timer.start();
  }

  updateTimer(time) {
    const timerElement = this.questionsContainer.querySelector(".timer");

    if (!timerElement) return;

    const timerValue = timerElement.querySelector(".timer-value");

    timerValue.textContent = time;

    if (time <= 5) {
      timerElement.classList.add("warning");
    } else {
      timerElement.classList.remove("warning");
    }
  }

  handleAnswer(answer) {
    if (!this.quiz || this.isAnswering) return;

    this.isAnswering = true;
    this.timer.stop();

    const isTimeout = answer === null;

    let isCorrect = false;

    if (isTimeout) {
      this.quiz.wrongCount++;
    } else {
      isCorrect = this.quiz.checkAnswer(answer);
    }

    this.soundManager.play(isCorrect);

    const answerButtons =
      this.questionsContainer.querySelectorAll(".answer-btn");

    answerButtons.forEach((button) => {
      button.disabled = true;
      button.classList.add("disabled");

      const buttonAnswer = button.dataset.answer;

      if (buttonAnswer === this.quiz.currentQuestion.correctAnswer) {
        button.classList.add("correct");
        button.classList.remove("disabled");
      }

      if (!isCorrect && buttonAnswer === answer && !isTimeout) {
        button.classList.add("wrong");
      }
    });

    const feedback = document.createElement("p");
    feedback.className = "answer-feedback";

    if (isTimeout) {
      feedback.textContent = "Time is up!";
    } else if (isCorrect) {
      feedback.textContent = "Correct answer!";
    } else {
      feedback.textContent = "Wrong answer!";
    }

    this.questionsContainer
      .querySelector(".question-card")
      .appendChild(feedback);

    const scoreElement = this.questionsContainer.querySelector(
      ".question-footer span",
    );

    if (scoreElement) {
      scoreElement.textContent = `Score: ${this.quiz.score}`;
    }

    this.advanceTimeout = setTimeout(() => {
      const hasNextQuestion = this.quiz.nextQuestion();

      if (hasNextQuestion) {
        this.renderQuestion();
      } else {
        this.showResults();
      }
    }, 1300);
  }

  showResults() {
    this.timer.stop();

    const score = this.quiz.score;
    const total = this.quiz.totalQuestions;
    const percentage = Math.round((score / total) * 100);
    const playerName = this.lastSettings.playerName;

    const previousBest = this.getBestScore();
    const isNewRecord = score > previousBest;

    this.saveScore(playerName, score);

    let message = "Good try! Keep practicing.";

    if (percentage >= 80) {
      message = "Excellent work!";
    } else if (percentage >= 50) {
      message = "Good job!";
    }

    this.questionsContainer.innerHTML = `
            <div class="results-card">

                <h2>Quiz Completed!</h2>

                <p class="result-message">
                    ${message}
                </p>

                <div class="result-score">
                    <span>${score}</span>
                    <span> / ${total}</span>
                </div>

                <h3>${percentage}%</h3>

                <div class="result-stats">
                    <div>
                        <span>Correct Answers</span>
                        <strong>${this.quiz.correctCount}</strong>
                    </div>

                    <div>
                        <span>Wrong Answers</span>
                        <strong>${this.quiz.wrongCount}</strong>
                    </div>
                </div>

                <p class="record-message">
                    ${isNewRecord ? "New personal record!" : ""}
                </p>

                <button
                    type="button"
                    class="play-again-btn"
                >
                    Play Again
                </button>

            </div>

            ${this.renderLeaderboard()}
        `;
  }

  getLeaderboard() {
    try {
      const savedScores = JSON.parse(localStorage.getItem(LEADERBOARD_KEY));

      return Array.isArray(savedScores) ? savedScores : [];
    } catch (error) {
      return [];
    }
  }

  getBestScore() {
    const leaderboard = this.getLeaderboard();

    if (!leaderboard.length) return 0;

    return Math.max(...leaderboard.map((item) => Number(item.score) || 0));
  }

  saveScore(playerName, score) {
    const leaderboard = this.getLeaderboard();

    leaderboard.push({
      name: playerName,
      score: score,
      date: new Date().toLocaleDateString(),
    });

    leaderboard.sort((a, b) => b.score - a.score);

    try {
      localStorage.setItem(
        LEADERBOARD_KEY,
        JSON.stringify(leaderboard.slice(0, 3)),
      );
    } catch (error) {
      console.warn("Could not save leaderboard:", error);
    }
  }

  renderLeaderboard() {
    const leaderboard = this.getLeaderboard();

    if (!leaderboard.length) return "";

    const scoresHTML = leaderboard
      .map(
        (item, index) => `
            <div class="leaderboard-item">
                <span>${index + 1}</span>
                <span>${escapeHTML(item.name)}</span>
                <strong>${item.score}</strong>
            </div>
        `,
      )
      .join("");

    return `
            <div class="leaderboard">
                <h3>Leaderboard</h3>
                ${scoresHTML}
            </div>
        `;
  }

  showError(message) {
    this.setupForm.hidden = true;

    this.questionsContainer.innerHTML = `
            <div class="error-card">
                <h2>Something went wrong</h2>
                <p>${escapeHTML(message)}</p>

                <button
                    type="button"
                    class="retry-btn"
                >
                    Try Again
                </button>
            </div>
        `;
  }

  showFormError(message) {
    this.clearFormError();

    const errorElement = document.createElement("p");
    errorElement.className = "form-error";
    errorElement.textContent = message;

    this.setupForm.appendChild(errorElement);
  }

  clearFormError() {
    const oldError = this.setupForm.querySelector(".form-error");

    if (oldError) {
      oldError.remove();
    }
  }

  resetToSetup() {
    this.timer.stop();
    clearTimeout(this.advanceTimeout);

    this.quiz = null;
    this.isAnswering = false;

    this.questionsContainer.innerHTML = "";
    this.setupForm.hidden = false;
  }
}

new QuizApp();
