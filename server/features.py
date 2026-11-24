"""The exact cleaning and feature functions copied from RandomForest_Final.ipynb."""
import difflib
import re

import jellyfish

MIRROR = {("b", "d"), ("d", "b"), ("p", "q"), ("q", "p")}


def clean(word):
    # lowercase, then delete every character that is not a-z
    return re.sub(r"[^a-z]", "", str(word).lower())


def extract_features(target, typed):
    ops = difflib.SequenceMatcher(None, target, typed).get_opcodes()
    n_replace = n_delete = n_insert = mirror_swaps = 0
    for tag, i1, i2, j1, j2 in ops:
        if tag == "replace":
            n_replace += 1
            if (target[i1:i2], typed[j1:j2]) in MIRROR:
                mirror_swaps += 1
        elif tag == "delete":
            n_delete += 1
        elif tag == "insert":
            n_insert += 1
    if len(target) == len(typed):
        mismatches = sum(1 for a, b in zip(target, typed) if a != b)
    else:
        mismatches = 0
    return {
        "len_diff": len(typed) - len(target),
        "same_letters": int(sorted(target) == sorted(typed)),
        "n_replace": n_replace,
        "n_delete": n_delete,
        "n_insert": n_insert,
        "mirror_swaps": mirror_swaps,
        "mismatches": mismatches,
        "sound_match": int(jellyfish.metaphone(target) == jellyfish.metaphone(typed)),
        "similarity": difflib.SequenceMatcher(None, target, typed).ratio(),
        "first_letter_same": int(target[0] == typed[0]),
    }
