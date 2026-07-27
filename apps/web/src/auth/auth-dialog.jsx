import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "./auth-context";

export function AuthDialog({ open, onOpenChange, onAuthenticated }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  if (!open) return null;

  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const authenticatedUser =
        mode === "login"
          ? await login({ email: form.email, password: form.password })
          : await register(form);
      onAuthenticated(authenticatedUser);
    } catch (requestError) {
      setError(requestError.message || "Unable to authenticate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create account"}</h2>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <Input value={form.firstName} onChange={setField("firstName")} placeholder="First name" required />
              <Input value={form.lastName} onChange={setField("lastName")} placeholder="Last name" required />
            </div>
          )}
          <Input type="email" value={form.email} onChange={setField("email")} placeholder="Email" autoComplete="email" required />
          <Input
            type="password"
            value={form.password}
            onChange={setField("password")}
            placeholder="Password (10+ characters)"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={10}
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <button
          className="mt-5 w-full text-center text-sm text-muted-foreground underline"
          type="button"
          onClick={() => {
            setMode((current) => (current === "login" ? "register" : "login"));
            setError("");
          }}
        >
          {mode === "login" ? "Need an account? Register" : "Already registered? Sign in"}
        </button>
      </div>
    </div>
  );
}
