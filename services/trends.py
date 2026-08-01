"""Unsupervised Trend & Topic Discovery Service for TechFlow Support Queue."""

from collections import Counter
import re
from schemas import TriagedTicket

STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "if", "because", "as", "what", "which",
    "this", "that", "these", "those", "then", "just", "so", "than", "such", "both",
    "through", "about", "against", "between", "into", "throughout", "during", "before",
    "after", "above", "below", "to", "from", "up", "upon", "down", "in", "out", "on",
    "off", "over", "under", "again", "further", "then", "once", "here", "there", "when",
    "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other",
    "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
    "very", "s", "t", "can", "will", "just", "don", "should", "now", "our", "we", "us",
    "my", "i", "me", "you", "your", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "having", "do", "does", "did", "doing", "please", "need", "urgent"
}


def extract_ngrams(text: str, n: int = 2) -> list[str]:
    """Extract n-grams from text excluding stopwords."""
    words = [w.lower() for w in re.findall(r'\b[a-zA-Z]{3,}\b', text) if w.lower() not in STOPWORDS]
    if len(words) < n:
        return []
    return [" ".join(words[i:i+n]) for i in range(len(words) - n + 1)]


def detect_emerging_topics(tickets: list[TriagedTicket], top_k: int = 4) -> list[dict]:
    """Detect emerging complaint spikes and topic clusters across incoming tickets."""
    if not tickets:
        return []

    bigram_counter: Counter[str] = Counter()
    unigram_counter: Counter[str] = Counter()
    ticket_map: dict[str, list[str]] = {}

    for t in tickets:
        comb_text = f"{t.subject} {t.body}"
        bigrams = extract_ngrams(comb_text, n=2)
        unigrams = extract_ngrams(comb_text, n=1)

        for bg in set(bigrams):
            bigram_counter[bg] += 1
            ticket_map.setdefault(bg, []).append(t.ticket_id)

        for ug in set(unigrams):
            unigram_counter[ug] += 1

    total_tickets = len(tickets)
    emerging_topics = []

    # Process top bigrams that appear in >= 2 tickets (or >= 5% of dataset)
    for phrase, count in bigram_counter.most_common(10):
        if count >= 2 or total_tickets <= 5:
            percentage = round((count / total_tickets) * 100, 1)
            emerging_topics.append({
                "topic": phrase.title(),
                "phrase": phrase,
                "count": count,
                "percentage": percentage,
                "ticket_ids": ticket_map.get(phrase, [])[:5]
            })
            if len(emerging_topics) >= top_k:
                break

    return emerging_topics
