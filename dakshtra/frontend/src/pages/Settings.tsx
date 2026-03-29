import { useState } from "react";

import Button from "../components/ui/Button";

export default function Settings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Profile Settings</h3>
        <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="file" className="input" />
        <Button>Save Profile</Button>
      </div>
      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Password Change</h3>
        <input className="input" type="password" placeholder="Old password" />
        <input className="input" type="password" placeholder="New password" />
        <input className="input" type="password" placeholder="Confirm password" />
        <Button>Update Password</Button>
      </div>
    </div>
  );
}
