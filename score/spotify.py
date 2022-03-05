import sqlite3


def quote(s):
    return f'"{s}"'


def remove_quotes(s):
    return s.replace('"', "")


def ensure_str(maybe_str):
    return str(maybe_str)


def generate_search_query(album_name):
    clean_name = remove_quotes(ensure_str(album_name))

    return quote(clean_name)


sqlite3.enable_callback_tracebacks(True)

con = sqlite3.connect("../data/progrock.db")

con.create_function("generate_album_search_query", 1, generate_search_query)

spotify_sql = open("spotify.sql")
con.executescript(spotify_sql.read())

con.close()
