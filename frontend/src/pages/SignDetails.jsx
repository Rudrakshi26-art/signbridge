import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Play,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { signs } from "../data/signs";

function SignDetails() {
  const { id } = useParams();

  const sign = signs.find(
    (item) => item.id === Number(id)
  );

  if (!sign) {
    return (
      <main className="not-found">
        <h2>Sign not found</h2>
        <Link to="/library">Back to library</Link>
      </main>
    );
  }

  return (
    <main className="sign-detail-page">
      <Link to="/library" className="back-link">
        <ArrowLeft size={17} />
        Back to library
      </Link>

      <section className="sign-detail">
        <div className="detail-image">
          <img
            src={sign.image}
            alt={`Indian Sign Language sign for ${sign.name}`}
          />
        </div>

        <div className="detail-content">
          <span className="section-tag">
            {sign.category}
          </span>

          <h1>{sign.name}</h1>

          <p>{sign.description}</p>

          <div className="detail-meta">
            <div>
              <span>Difficulty</span>
              <strong>{sign.difficulty}</strong>
            </div>

            <div>
              <span>Language</span>
              <strong>ISL</strong>
            </div>
          </div>

          <div className="learning-note">
            <CheckCircle2 size={20} />
            <div>
              <strong>Learn visually</strong>
              <p>
                Follow the reference carefully and practice
                the gesture before moving to the quiz.
              </p>
            </div>
          </div>

          <div className="detail-actions">
            <Link to="/practice" className="primary-button">
              <Play size={17} />
              Practice this sign
            </Link>

            <button className="secondary-button">
              <BookOpen size={17} />
              Add to learning
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default SignDetails;