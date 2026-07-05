import { useEffect, useRef, useState } from "react";
import { fetchSuggestions } from "../api/jikan";

// The guess text box with an autocomplete dropdown of anime titles.
// The parent owns the input value; this component only manages suggestions.
export default function GuessInput({ inputRef, value, onChange, onSubmitEnter }) {
  const [suggestions, setSuggestions] = useState([]);
  const containerRef = useRef(null);

  // Fetch suggestions as the user types, debounced by 300ms so we call the
  // API once per pause in typing rather than on every keystroke.
  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const results = await fetchSuggestions(query);
      setSuggestions(results);
    }, 300);

    return () => clearTimeout(timeout);
  }, [value]);

  // Close the dropdown when the user clicks anywhere outside it.
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="input-row">
      <div className="input-and-suggestions" ref={containerRef}>
        <input
          type="text"
          id="guess-input"
          ref={inputRef}
          placeholder="Enter anime title here..."
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.code === "Enter") {
              e.preventDefault();
              onSubmitEnter();
            }
          }}
        />
        <ul id="suggestions" className={suggestions.length === 0 ? "hidden" : ""}>
          {suggestions.map((anime) => (
            <li
              key={anime.mal_id ?? anime.title}
              onClick={() => {
                onChange(anime.title);
                setSuggestions([]);
              }}
            >
              {anime.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
