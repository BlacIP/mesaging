#!/usr/bin/env python3
"""Legacy macOS sender. Usage: send.py morning|night [--dry-run]."""

import datetime
import json
import os
import random
import subprocess
import sys
import time
import urllib.parse

BASE = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE, "config.json")
MESSAGES_PATH = os.path.join(BASE, "messages.json")
STATE_PATH = os.path.join(BASE, "state.json")
LOG_PATH = os.path.join(BASE, "sent.log")


def load_json(path, default):
    try:
        with open(path) as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return default


def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def log(line):
    stamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_PATH, "a") as f:
        f.write(f"[{stamp}] {line}\n")
    print(line)


def pick_message(period, config):
    messages = load_json(MESSAGES_PATH, {})
    pool = messages.get(period, [])
    if not pool:
        raise SystemExit(f"No messages in the bank for '{period}'. Add some at http://localhost:8787")

    state = load_json(STATE_PATH, {})
    used = state.get(f"used_{period}", [])
    unused_indexes = [i for i in range(len(pool)) if i not in used]
    if not unused_indexes:  # whole bank used — start over
        used = []
        unused_indexes = list(range(len(pool)))

    idx = random.choice(unused_indexes)
    used.append(idx)
    state[f"used_{period}"] = used
    save_json(STATE_PATH, state)

    return pool[idx].replace("{name}", config.get("her_name", "my love"))


def send_imessage(message, to):
    script = (
        'on run argv\n'
        'tell application "Messages"\n'
        'set s to 1st account whose service type = iMessage\n'
        'send (item 1 of argv) to participant (item 2 of argv) of s\n'
        'end tell\n'
        'end run'
    )
    subprocess.run(["osascript", "-e", script, message, to], check=True, timeout=60)


def send_whatsapp(message, phone):
    url = f"whatsapp://send?phone={phone}&text={urllib.parse.quote(message)}"
    subprocess.run(["open", url], check=True)
    time.sleep(8)  # give WhatsApp time to open and fill the message box
    press_enter = (
        'tell application "WhatsApp" to activate\n'
        'delay 1\n'
        'tell application "System Events" to keystroke return'
    )
    subprocess.run(["osascript", "-e", press_enter], check=True, timeout=60)


def schedule_next_wake(period, config):
    """Schedule the Mac wake before the next configured send time."""
    now = datetime.datetime.now()
    if period == "morning":
        hh, mm = config.get("night_time", "22:00").split(":")
        target = now.replace(hour=int(hh), minute=int(mm), second=0, microsecond=0)
    else:
        hh, mm = config.get("morning_time", "07:00").split(":")
        target = (now + datetime.timedelta(days=1)).replace(
            hour=int(hh), minute=int(mm), second=0, microsecond=0)
    target -= datetime.timedelta(minutes=2)  # wake 2 minutes early
    if target <= now:
        return
    stamp = target.strftime("%m/%d/%y %H:%M:%S")
    result = subprocess.run(["sudo", "-n", "pmset", "schedule", "wake", stamp],
                            capture_output=True, text=True)
    if result.returncode == 0:
        log(f"Scheduled next wake for {stamp}")
    else:
        log(f"Could not schedule wake (run install.sh sudo step): {result.stderr.strip()}")


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ("morning", "night"):
        raise SystemExit("Usage: send.py morning|night [--dry-run]")
    period = sys.argv[1]
    dry_run = "--dry-run" in sys.argv

    config = load_json(CONFIG_PATH, {})
    if "XXXX" in config.get("imessage_to", "XXXX"):
        log("config.json still has a placeholder phone number — set it at http://localhost:8787")
        raise SystemExit(1)

    message = pick_message(period, config)
    if dry_run:
        log(f"[dry-run] {period}: {message}")
        return

    errors = []
    if config.get("send_imessage", True):
        try:
            send_imessage(message, config["imessage_to"])
            log(f"iMessage sent ({period}): {message}")
        except Exception as e:
            errors.append(f"iMessage failed: {e}")
    if config.get("send_whatsapp", True):
        try:
            send_whatsapp(message, config["whatsapp_phone"])
            log(f"WhatsApp sent ({period}): {message}")
        except Exception as e:
            errors.append(f"WhatsApp failed: {e}")

    schedule_next_wake(period, config)

    if errors:
        for e in errors:
            log(e)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
