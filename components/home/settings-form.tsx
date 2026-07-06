"use client";

import { FormEvent } from "react";
import { AppConfig } from "@/lib/types";

type Props = {
  config: AppConfig;
  editing: boolean;
  onCancel: () => void;
  onChange: (config: AppConfig) => void;
  onEdit: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

const futureFields = [
  ["iMessage number / Apple ID", "imessage_to", "+2348012345678", "Future server/macOS sending only"],
  ["WhatsApp number", "whatsapp_phone", "2348012345678", "Future WhatsApp API or Shortcut config only"],
  ["Morning time", "morning_time", "", "Set this in iPhone Shortcuts for now"],
  ["Night time", "night_time", "", "Set this in iPhone Shortcuts for now"]
] as const;

export function SettingsForm({ config, editing, onCancel, onChange, onEdit, onSave }: Props) {
  return (
    <form className="panel settings" onSubmit={onSave}>
      <div className="panel-heading">
        <div>
          <h2>Settings</h2>
          <p>Only her name affects messages right now. Other settings are parked for later sending features.</p>
        </div>
        <div className="settings-actions">
          {editing ? <EditActions onCancel={onCancel} /> : <button type="button" onClick={onEdit}>Edit settings</button>}
        </div>
      </div>

      <div className="settings-view">
        <span>Current name replacement</span>
        <strong>{config.her_name || "My Love"}</strong>
      </div>

      <div className="form-grid">
        <label>
          Her name
          <input
            disabled={!editing}
            value={config.her_name}
            onChange={(event) => onChange({ ...config, her_name: event.target.value })}
            placeholder="My Love"
          />
        </label>
        {futureFields.map(([label, key, placeholder, hint]) => (
          <label className="future-setting" key={key}>
            {label}
            <input
              disabled
              readOnly
              type={key.includes("time") ? "time" : "text"}
              value={String(config[key])}
              placeholder={placeholder}
            />
            <span>{hint}</span>
          </label>
        ))}
      </div>
    </form>
  );
}

function EditActions({ onCancel }: { onCancel: () => void }) {
  return (
    <>
      <button className="secondary-button" type="button" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit">Save settings</button>
    </>
  );
}
