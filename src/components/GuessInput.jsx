import { useEffect, useRef, useState } from "react";
import { fetchSuggestions } from "../api/jikan";

// The guess row: pill text box with an autocomplete dropdown, plus the blue
// Submit pill beside it. The parent owns the input value and submit logic;
// this component only manages suggestions. `localSearch` (daily mode) shows
// instant matches from a local title list, topped up by the online lookup.
export default function GuessInput({
  localSearch,
  inputRef,
  value,
  onChange,
  onSubmitEnter,
  submitVisible,
  onSubmit,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const containerRef = useRef(null);
  // Set when the value change came from clicking a suggestion, so the fetch
  // effect below skips one run instead of reopening the dropdown.
  const justSelectedRef = useRef(false);

  // Fetch suggestions as the user types, debounced by 300ms so we call the
  // API once per pause in typing rather than on every keystroke.
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const local = localSearch ? localSearch(query) : [];
    if (local.length > 0) setSuggestions(local);
    if (local.length >= 5) return;

    let cancelled = false;
    const timeout = setTimeout(async () => {
      const online = await fetchSuggestions(query);
      if (cancelled) return;
      const seen = new Set(local.map((s) => s.title.toLowerCase()));
      const extra = online.filter((s) => !seen.has(s.title.toLowerCase()));
      setSuggestions([...local, ...extra].slice(0, 5));
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [value, localSearch]);

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
    <div className="flex gap-2.5 mt-[18px] relative">
      <div className="relative flex-1" ref={containerRef}>
        <input
          type="text"
          id="guess-input"
          ref={inputRef}
          placeholder="Name this anime…"
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
                justSelectedRef.current = true;
                onChange(anime.title);
                setSuggestions([]);
              }}
            >
              {anime.title}
            </li>
          ))}
        </ul>
      </div>
      {submitVisible && (
        <button
          id="submit-btn"
          className="h-[46px] px-[26px] rounded-[980px] border-none bg-accent text-white
            font-medium text-[15px] tracking-[-0.01em] cursor-pointer shrink-0
            transition-colors duration-200 hover:bg-accent-hover"
          onClick={onSubmit}
        >
          Submit
        </button>
      )}
    </div>
  );
}
