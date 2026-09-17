import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { signs } from "../data/signs";

const questions = [
  {
    signId: 1,
    options: ["Hello", "Help", "Yes", "No"],
    answer: "Hello",
  },
  {
    signId: 2,
    options: ["Help", "Thank You", "Hello", "Yes"],
    answer: "Thank You",
  },
  {
    signId: 3,
    options: ["No", "Help", "Thank You", "Hello"],
    answer: "Help",
  },
  {
    signId: 4,
    options: ["Yes", "No", "Hello", "Help"],
    answer: "Yes",
  },
];

function Practice() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [complete, setComplete] = useState(false);

  const question = questions[current];

  const sign = signs.find(
    (item) => item.id === question.signId
  );

  const chooseAnswer = (answer) => {
    if (selected) return;

    setSelected(answer);

    if (answer === question.answer) {
      setScore((value) => value + 1);
    }
  };

  const next = () => {
    if (current === questions.length - 1) {
      setComplete(true);
      return;
    }

    setCurrent((value) => value + 1);
    setSelected(null);
  };

  const restart = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setComplete(false);
  };

  if (complete) {
    const percentage = Math.round(
      (score / questions.length) * 100
    );

    return (
      <main className="practice-page">
        <section className="practice-result">
          <div className="result-symbol">✓</div>

          <span className="section-tag">PRACTICE COMPLETE</span>

          <h1>Nice work.</h1>

          <p>
            You've completed today's ISL practice session.
          </p>

          <div className="result-score">
            <strong>{percentage}%</strong>
            <span>
              {score} of {questions.length} correct
            </span>
          </div>

          <div className="result-actions">
            <button
              className="primary-button"
              onClick={restart}
            >
              <RotateCcw size={17} />
              Practice again
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="practice-page">
      <section className="practice-intro">
        <span className="section-tag">PRACTICE</span>

        <h1>
          Put your
          <br />
          <em>knowledge</em> to the test.
        </h1>

        <p>
          Identify the sign shown below and choose the correct
          meaning.
        </p>
      </section>

      <section className="practice-container">
        <div className="practice-top">
          <div>
            <span>QUESTION</span>
            <strong>
              {String(current + 1).padStart(2, "0")} /{" "}
              {String(questions.length).padStart(2, "0")}
            </strong>
          </div>

          <div className="practice-progress">
            <div
              style={{
                width: `${
                  ((current + 1) / questions.length) * 100
                }%`,
              }}
            />
          </div>
        </div>

        <div className="practice-card">
          <div className="practice-image">
            <img
              src={sign.image}
              alt={`ISL sign for ${sign.name}`}
            />
          </div>

          <div className="practice-question">
            <span>WHAT DOES THIS SIGN MEAN?</span>
            <h2>Select the correct answer.</h2>
          </div>

          <div className="answer-grid">
            {question.options.map((option) => {
              let className = "answer-button";

              if (selected) {
                if (option === question.answer) {
                  className += " answer-correct";
                } else if (option === selected) {
                  className += " answer-wrong";
                }
              }

              return (
                <button
                  key={option}
                  className={className}
                  onClick={() => chooseAnswer(option)}
                >
                  <span>{option}</span>

                  {selected &&
                    option === question.answer && (
                      <CheckCircle2 size={19} />
                    )}

                  {selected &&
                    option === selected &&
                    option !== question.answer && (
                      <XCircle size={19} />
                    )}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="answer-feedback">
              <div>
                {selected === question.answer ? (
                  <>
                    <CheckCircle2 size={19} />
                    <strong>Correct!</strong>
                  </>
                ) : (
                  <>
                    <XCircle size={19} />
                    <strong>
                      The correct answer is {question.answer}.
                    </strong>
                  </>
                )}
              </div>

              <button
                className="next-button"
                onClick={next}
              >
                {current === questions.length - 1
                  ? "View Result"
                  : "Next"}
                <ArrowRight size={17} />
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Practice;