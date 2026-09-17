import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

function SignCard({ sign }) {
  return (
    <Link to={`/sign/${sign.id}`} className="sign-card-new">
      <div className="sign-image">
        <img src={sign.image} alt={`ISL sign for ${sign.name}`} />

        <span className="difficulty">
          {sign.difficulty}
        </span>
      </div>

      <div className="sign-card-content">
        <div>
          <span className="sign-category">{sign.category}</span>
          <h3>{sign.name}</h3>
        </div>

        <div className="round-arrow">
          <ArrowUpRight size={18} />
        </div>
      </div>
    </Link>
  );
}

export default SignCard;