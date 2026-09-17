import { useState } from "react";
import { CheckCircle, XCircle, RotateCcw, ArrowRight } from "lucide-react";

const questions = [
  {
    sign: "👋",
    question: "What does this sign represent?",
    options: ["Hello", "Thank You", "Help", "No"],
    answer: "Hello",
  },
  {
    sign: "🙏",
    question: "What does this sign represent?",
    options: ["Yes", "Thank You", "Hello", "Help"],
    answer: "Thank You",
  },
  {
    sign: "👍",
    question: "What does this sign represent?",
    options: ["No", "Help", "Yes", "Hello"],
    answer: "Yes",
  },
  {
    sign: "🫶",
    question: "What does this sign represent?",
    options: ["Help", "Thank You", "No", "Yes"],
    answer: "Help",
  },
  {
    sign: "👎",
    question: "What does this sign represent?",
    options: ["Hello", "No", "Yes", "Thank You"],
    answer: "No",
  },
];

function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[currentQuestion];

  const handleAnswer = (option) => {
    if (selectedAnswer) return;

    setSelectedAnswer(option);

    if (option === question.answer) {
      setScore((previous) => previous + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion === questions.length - 1) {
      setFinished(true);
      return;
    }

    setCurrentQuestion((previous) => previous + 1);
    setSelectedAnswer(null);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <section className="quiz-section" id="quiz">
        <div className="quiz-result">
          <div className="result-icon">🎉</div>

          <span className="section-tag">QUIZ COMPLETE</span>

          <h2>Great job!</h2>

          <p>You completed the SignBridge practice quiz.</p>

          <div className="score-circle">
            <strong>{percentage}%</strong>
            <span>{score} / {questions.length} correct</span>
          </div>

          <button className="primary-button" onClick={restartQuiz}>
            <RotateCcw size={17} />
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="quiz-section" id="quiz">
      <div className="quiz-header">
        <div>
          <span className="section-tag">TEST YOURSELF</span>
          <h2>How well do you know your signs?</h2>
        </div>

        <div className="question-count">
          {currentQuestion + 1} / {questions.length}
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${((currentQuestion + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="quiz-card">
        <div className="quiz-sign">
          <span>{question.sign}</span>
        </div>

        <h3>{question.question}</h3>

        <div className="quiz-options">
          {question.options.map((option) => {
            let className = "quiz-option";

            if (selectedAnswer) {
              if (option === question.answer) {
                className += " correct";
              } else if (option === selectedAnswer) {
                className += " incorrect";
              }
            }

            return (
              <button
                key={option}
                className={className}
                onClick={() => handleAnswer(option)}
              >
                <span>{option}</span>

                {selectedAnswer && option === question.answer && (
                  <CheckCircle size={19} />
                )}

                {selectedAnswer &&
                  option === selectedAnswer &&
                  option !== question.answer && (
                    <XCircle size={19} />
                  )}
              </button>
            );
          })}
        </div>

        {selectedAnswer && (
          <div className="quiz-bottom">
            <div>
              {selectedAnswer === question.answer ? (
                <strong>✓ Correct! Well done.</strong>
              ) : (
                <strong>Not quite. Keep practicing!</strong>
              )}
            </div>

            <button className="next-button" onClick={nextQuestion}>
              {currentQuestion === questions.length - 1
                ? "See Result"
                : "Next Question"}
              <ArrowRight size={17} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default Quiz;