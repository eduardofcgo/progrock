import sqlite3


def extract_synonyms(artist_name):
    splitted = artist_name.split("(", maxsplit=1)

    if len(splitted) == 1:
        return set()
    else:
        [full_name, short_name_with_parentesis] = splitted
        short_name = short_name_with_parentesis[:-1]
        return {full_name, short_name}


def ensure_str(maybe_str):
    return str(maybe_str)


def quote(s):
    return f'"{s}"'


def generate_search_query(artist_name):
    artist_name = ensure_str(artist_name)
    search_names = {artist_name, *extract_synonyms(artist_name)}

    return " OR ".join(map(quote, search_names))


def calculate_score(nmatches, nreviews):
    return nmatches ** 4 / nreviews ** 3


sqlite3.enable_callback_tracebacks(True)

con = sqlite3.connect("../data/progrock.db")

con.create_function("generate_artist_search_query", 1, generate_search_query)
con.create_function("calculate_score", 2, calculate_score)

score_sql = open("similarity.sql")
con.executescript(score_sql.read())

con.close()
