import { Search, ArrowRight, Hand } from "lucide-react";
import { useState } from "react";

const signs = [
  { letter: "01", name: "One", category: "Numbers", emoji: "☝️" },
  { letter: "02", name: "Two", category: "Numbers", emoji: "✌️" },
  { letter: "03", name: "Three", category: "Numbers", emoji: "🤟" },

  { letter: "HI", name: "Hello", category: "Phrases", emoji: "👋" },
  { letter: "TY", name: "Thank You", category: "Phrases", emoji: "🙏" },
  { letter: "YES", name: "Yes", category: "Phrases", emoji: "👍" },
  { letter: "NO", name: "No", category: "Phrases", emoji: "👎" },
  { letter: "HELP", name: "Help", category: "Phrases", emoji: "🫶" },
];

function SignLibrary() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filteredSigns = signs.filter((sign) => {
    const matchesCategory =
      category === "All" || sign.category === category;

    const matchesSearch = sign.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <section className="library-section" id="library">
      <div className="library-header">
        <div>
          <span className="section-tag">EXPLORE SIGNS</span>
          <h2>Build your sign vocabulary.</h2>
          <p>
            Explore common signs and learn their meaning through visual
            practice.
          </p>
        </div>

        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search signs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="category-tabs">
        {["All", "Numbers", "Phrases"].map((item) => (
          <button
            key={item}
            className={category === item ? "active-tab" : ""}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="sign-grid">
        {filteredSigns
          .filter((sign) => sign.category?.toLowerCase() !== "alphabet")
          .map((sign) => (
          <div className="sign-card" key={`${sign.category}-${sign.name}`}>
            <div className="sign-visual">
              <span>{sign.emoji}</span>
            </div>

            <div className="sign-info">
              <div>
                <span>{sign.category}</span>
                <h3>{sign.name}</h3>
              </div>

              <button className="learn-button">
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSigns.length === 0 && (
        <div className="empty-state">
          <Hand size={30} />
          <h3>No signs found</h3>
          <p>Try searching for another word.</p>
        </div>
      )}
    </section>
  );
}

export default SignLibrary;