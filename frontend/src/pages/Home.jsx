import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Hand,
  Heart,
  Play,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { signs } from "../data/signs";

function Home() {
  const featuredSigns = signs.slice(0, 4);

  return (
    <main className="home-page">
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="hero-eyebrow">
            <Hand size={16} />
            Indian Sign Language
          </div>

          <h1>
            Learn to
            <br />
            <em>communicate.</em>
          </h1>

          <p>
            SignBridge helps you learn Indian Sign Language through
            visual lessons, interactive practice and simple,
            meaningful progress tracking.
          </p>

          <div className="hero-actions">
            <Link to="/library" className="primary-button">
              Explore ISL
              <ArrowRight size={18} />
            </Link>

            <Link to="/practice" className="secondary-button">
              <Play size={17} />
              Practice
            </Link>
          </div>

          <div className="hero-note">
            <CheckCircle2 size={17} />
            <span>Designed for beginners</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-visual-label">
            <span>Featured sign</span>
            <strong>Hello</strong>
          </div>

          <div className="hero-hand">
            <Hand size={130} strokeWidth={1.2} />
          </div>

          <div className="hero-caption">
            <span>Indian Sign Language</span>
            <span>Beginner</span>
          </div>
        </div>
      </section>

      {/* PURPOSE */}
      <section className="purpose-section">
        <div className="purpose-heading">
          <span className="section-tag">WHY SIGNBRIDGE?</span>
          <h2>
            Communication should
            <br />
            be accessible to everyone.
          </h2>
        </div>

        <div className="purpose-content">
          <p>
            Learning sign language can help create stronger connections
            between Deaf and hearing communities. SignBridge makes
            getting started simple through visual learning and
            hands-on practice.
          </p>

          <Link to="/library" className="text-link">
            Start with the library
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div className="section-heading-center">
          <span className="section-tag">HOW IT WORKS</span>
          <h2>Learn. Practice. Progress.</h2>
          <p>
            A simple learning experience designed to help you build
            confidence one sign at a time.
          </p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>

            <div className="step-icon">
              <BookOpen />
            </div>

            <h3>Explore</h3>

            <p>
              Browse the ISL library and discover signs grouped into
              useful categories.
            </p>
          </div>

          <div className="step-card highlighted-step">
            <div className="step-number">02</div>

            <div className="step-icon">
              <Brain />
            </div>

            <h3>Practice</h3>

            <p>
              Test your understanding with visual quizzes and instant
              feedback.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">03</div>

            <div className="step-icon">
              <TrendingUp />
            </div>

            <h3>Progress</h3>

            <p>
              Track the signs you've learned and see how your
              practice improves over time.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED SIGNS */}
      <section className="featured-section">
        <div className="featured-header">
          <div>
            <span className="section-tag">START HERE</span>
            <h2>Learn your first signs.</h2>
          </div>

          <Link to="/library" className="text-link">
            View all signs
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="featured-grid">
          {featuredSigns.map((sign) => (
            <Link
              to={`/sign/${sign.id}`}
              className="home-sign-card"
              key={sign.id}
            >
              <div className="home-sign-image">
                <img
                  src={sign.image}
                  alt={`ISL sign for ${sign.name}`}
                />
              </div>

              <div className="home-sign-info">
                <div>
                  <span>{sign.category}</span>
                  <h3>{sign.name}</h3>
                </div>

                <ArrowRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ACCESSIBILITY */}
      <section className="accessibility-section">
        <div className="accessibility-icon">
          <Heart />
        </div>

        <div>
          <span className="section-tag">BUILT WITH PURPOSE</span>

          <h2>
            More than learning signs.
            <br />
            It's about building connection.
          </h2>

          <p>
            SignBridge is designed around visual-first learning,
            straightforward navigation and an accessible experience
            for people at every stage of their learning journey.
          </p>
        </div>

        <div className="accessibility-badge">
          <ShieldCheck size={18} />
          <span>Accessibility focused</span>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <span className="section-tag">YOUR FIRST STEP</span>

        <h2>
          Start learning
          <br />
          <em>today.</em>
        </h2>

        <p>
          Explore the ISL library and learn your first sign in just
          a few minutes.
        </p>

        <Link to="/library" className="primary-button">
          Explore ISL Library
          <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}

export default Home;