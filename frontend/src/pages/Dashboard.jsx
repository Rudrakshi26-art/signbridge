import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  Target,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <span className="section-tag">YOUR PROGRESS</span>

          <h1>
            Keep building
            <br />
            <em>your confidence.</em>
          </h1>

          <p>
            Here's a snapshot of your SignBridge learning journey.
          </p>
        </div>

        <div className="streak-card">
          <Flame size={21} />
          <div>
            <strong>5 day streak</strong>
            <span>Keep it going!</span>
          </div>
        </div>
      </section>

      <section className="dashboard-stats">
        <div className="dashboard-stat">
          <div className="stat-icon">
            <BookOpen size={19} />
          </div>

          <span>Signs learned</span>
          <strong>32</strong>
          <small>+6 this week</small>
        </div>

        <div className="dashboard-stat">
          <div className="stat-icon">
            <Target size={19} />
          </div>

          <span>Practice accuracy</span>
          <strong>87%</strong>
          <small>+8% this week</small>
        </div>

        <div className="dashboard-stat">
          <div className="stat-icon">
            <TrendingUp size={19} />
          </div>

          <span>Practice sessions</span>
          <strong>12</strong>
          <small>3 this week</small>
        </div>
      </section>

      <section className="progress-layout">
        <div className="learning-progress">
          <div className="section-title-row">
            <div>
              <span className="section-tag">LEARNING</span>
              <h2>Your progress</h2>
            </div>

            <span>Overall 74%</span>
          </div>

          <div className="progress-item">
            <div>
              <span>Alphabet</span>
              <strong>80%</strong>
            </div>

            <div className="dashboard-progress">
              <div style={{ width: "80%" }} />
            </div>
          </div>

          <div className="progress-item">
            <div>
              <span>Everyday signs</span>
              <strong>72%</strong>
            </div>

            <div className="dashboard-progress">
              <div style={{ width: "72%" }} />
            </div>
          </div>

          <div className="progress-item">
            <div>
              <span>Numbers</span>
              <strong>60%</strong>
            </div>

            <div className="dashboard-progress">
              <div style={{ width: "60%" }} />
            </div>
          </div>

          <div className="progress-item">
            <div>
              <span>Phrases</span>
              <strong>45%</strong>
            </div>

            <div className="dashboard-progress">
              <div style={{ width: "45%" }} />
            </div>
          </div>
        </div>

        <div className="continue-card">
          <span className="section-tag">CONTINUE LEARNING</span>

          <div className="continue-icon">
            🤟
          </div>

          <h3>Everyday signs</h3>

          <p>
            Continue learning useful signs for everyday
            conversations.
          </p>

          <Link to="/library" className="primary-button">
            Continue
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section className="recent-section">
        <div className="section-title-row">
          <div>
            <span className="section-tag">RECENT ACTIVITY</span>
            <h2>Your learning activity</h2>
          </div>
        </div>

        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-check">
              <CheckCircle2 size={18} />
            </div>

            <div>
              <strong>Completed Everyday Signs</strong>
              <span>6 signs learned</span>
            </div>

            <time>Today</time>
          </div>

          <div className="activity-item">
            <div className="activity-check">
              <CheckCircle2 size={18} />
            </div>

            <div>
              <strong>Completed practice quiz</strong>
              <span>87% accuracy</span>
            </div>

            <time>Yesterday</time>
          </div>

          <div className="activity-item">
            <div className="activity-check">
              <CheckCircle2 size={18} />
            </div>

            <div>
              <strong>Learned 8 new signs</strong>
              <span>Alphabet</span>
            </div>

            <time>2 days ago</time>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;