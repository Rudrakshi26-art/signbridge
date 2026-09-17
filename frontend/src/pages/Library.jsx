import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import SignCard from "../components/SignCard";

const API_URL = "http://localhost:5000/api";

/* =========================
   SIGN IMAGE MAP
========================= */

const SIGN_IMAGES = {
  doctor: "/signs/doctor.jpg",
  food: "/signs/food.jpg",
  hello: "/signs/hello.jpg",
  help: "/signs/help.jpg",
  "how-are-you": "/signs/how-are-you.jpg",
  no: "/signs/no.jpg",
  "please-wait": "/signs/please-wait.jpg",
  sorry: "/signs/sorry.jpg",
  "thank-you": "/signs/thank-you.jpg",
  water: "/signs/water.jpg",
  yes: "/signs/yes.jpg",

  /* Library phrase names */
  "i-need-help": "/signs/help.jpg",
  "i-need-water": "/signs/water.jpg",
  "i-need-a-doctor": "/signs/doctor.jpg",
};


/* =========================
   CONVERT NAME TO KEY
========================= */

const getSignKey = (name = "") => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[?!.,]/g, "")
    .replace(/\s+/g, "-");
};


function Library() {
  const [signs, setSigns] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  /* =========================
     GET SIGNS FROM BACKEND
  ========================= */

  useEffect(() => {
    const fetchSigns = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/signs`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch signs");
        }

        const result = await response.json();

        const backendSigns = result.data || [];

        const signsWithImages =
          backendSigns.map((sign) => {
            const key =
              sign.key ||
              sign.slug ||
              getSignKey(sign.name);

            return {
              ...sign,
              image:
                SIGN_IMAGES[key] ||
                sign.image ||
                sign.imageUrl ||
                "",
            };
          });

        setSigns(signsWithImages);

      } catch (err) {
        console.error(
          "Library API Error:",
          err
        );

        setError(
          "Unable to load signs. Please check your backend."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchSigns();
  }, []);


  /* =========================
     FILTER SIGNS
  ========================= */

  const filteredSigns = signs.filter((sign) => {

    /*
      Remove alphabet signs.
    */
    if (
      sign.category?.toLowerCase() ===
      "alphabet"
    ) {
      return false;
    }

    /*
      Remove number signs.
    */
    if (
      sign.category?.toLowerCase() ===
      "numbers"
    ) {
      return false;
    }

    const signName =
      sign.name || "";

    const matchesSearch =
      signName
        .toLowerCase()
        .includes(
          search.toLowerCase()
        );

    const matchesCategory =
      category === "All" ||
      sign.category === category;

    return (
      matchesSearch &&
      matchesCategory
    );
  });


  return (
    <main className="library-page">

      {/* =========================
          PAGE INTRO
      ========================= */}

      <section className="page-intro">

        <span className="section-tag">
          INDIAN SIGN LANGUAGE
        </span>

        <h1>
          Explore the
          <br />
          <em>ISL Library.</em>
        </h1>

        <p>
          Learn commonly used Indian Sign
          Language signs through visual
          references and guided practice.
        </p>

      </section>


      {/* =========================
          SEARCH + FILTER
      ========================= */}

      <section className="library-controls">

        <div className="search-input">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search signs..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <div className="category-filter">

          <SlidersHorizontal size={17} />

          {["All", "Everyday"].map(
            (item) => (

              <button
                key={item}
                className={
                  category === item
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setCategory(item)
                }
              >
                {item}
              </button>

            )
          )}

        </div>

      </section>


      {/* =========================
          RESULTS
      ========================= */}

      <section className="library-results">

        <div className="results-header">

          <span>
            {loading
              ? "Loading..."
              : `${filteredSigns.length} signs`}
          </span>

          <span>
            Indian Sign Language
          </span>

        </div>


        {/* =========================
            LOADING
        ========================= */}

        {loading && (

          <div className="no-results">

            <h3>
              Loading signs...
            </h3>

            <p>
              Connecting to the
              SignBridge server.
            </p>

          </div>

        )}


        {/* =========================
            ERROR
        ========================= */}

        {!loading && error && (

          <div className="no-results">

            <h3>
              Unable to load signs
            </h3>

            <p>
              {error}
            </p>

          </div>

        )}


        {/* =========================
            SIGN GRID
        ========================= */}

        {!loading && !error && (

          <>

            <div className="sign-grid-new">

              {filteredSigns.map(
                (sign) => (

                  <SignCard
                    key={sign.id}
                    sign={sign}
                  />

                )
              )}

            </div>


            {/* =========================
                NO RESULTS
            ========================= */}

            {filteredSigns.length === 0 && (

              <div className="no-results">

                <h3>
                  No signs found
                </h3>

                <p>
                  Try another search term.
                </p>

              </div>

            )}

          </>

        )}

      </section>

    </main>
  );
}

export default Library;

