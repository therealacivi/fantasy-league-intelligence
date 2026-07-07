"use client";

import { FormEvent, useMemo, useState } from "react";

type LeagueData = {
  name: string;
  season: number;
  total_rosters: number;
  status: string;
};

type SleeperUser = {
  user_id: string;
  display_name?: string;
  username?: string;
};

type SleeperRoster = {
  roster_id: number;
  owner_id: string;
  players: string[];
};

export default function Home() {
  const [leagueId, setLeagueId] = useState("");
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [owners, setOwners] = useState<SleeperUser[]>([]);
  const [rosters, setRosters] = useState<SleeperRoster[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const ownerLookup = useMemo(() => {
    return owners.reduce<Record<string, SleeperUser>>((accumulator, user) => {
      accumulator[user.user_id] = user;
      return accumulator;
    }, {});
  }, [owners]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedLeagueId = leagueId.trim();

    if (!trimmedLeagueId) {
      setError("League not found.");
      setLeagueData(null);
      setOwners([]);
      setRosters([]);
      return;
    }

    setIsLoading(true);
    setError("");
    setLeagueData(null);
    setOwners([]);
    setRosters([]);

    try {
      const [leagueResponse, usersResponse, rostersResponse] = await Promise.all([
        fetch(`https://api.sleeper.app/v1/league/${trimmedLeagueId}`),
        fetch(`https://api.sleeper.app/v1/league/${trimmedLeagueId}/users`),
        fetch(`https://api.sleeper.app/v1/league/${trimmedLeagueId}/rosters`),
      ]);

      if (!leagueResponse.ok) {
        throw new Error("League not found.");
      }

      if (!usersResponse.ok || !rostersResponse.ok) {
        throw new Error("Unable to import league data.");
      }

      const [league, users, rostersData] = await Promise.all([
        leagueResponse.json() as Promise<Partial<LeagueData>>,
        usersResponse.json() as Promise<SleeperUser[]>,
        rostersResponse.json() as Promise<SleeperRoster[]>,
      ]);

      if (!league?.name) {
        throw new Error("League not found.");
      }

      setLeagueData({
        name: league.name ?? "Unknown league",
        season: league.season ?? 0,
        total_rosters: league.total_rosters ?? 0,
        status: league.status ?? "Unknown",
      });
      setOwners(users ?? []);
      setRosters(rostersData ?? []);
    } catch (error) {
      const message =
        error instanceof Error && error.message === "League not found."
          ? "League not found."
          : "Unable to import league data. Please try again.";

      setError(message);
      setLeagueData(null);
      setOwners([]);
      setRosters([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col items-center justify-center text-center">
        <div className="mb-6 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1 text-sm font-medium text-blue-200">
          Fantasy football insights, simplified
        </div>

        <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Fantasy League Intelligence
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
          Analyze your fantasy football leagues across Sleeper, ESPN, and Yahoo.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 w-full max-w-3xl rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-2xl shadow-black/30 backdrop-blur"
        >
          <label
            htmlFor="league-id"
            className="mb-2 block text-left text-sm font-medium text-slate-300"
          >
            Sleeper League ID
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="league-id"
              type="text"
              value={leagueId}
              onChange={(event) => setLeagueId(event.target.value)}
              placeholder="Enter your Sleeper league ID"
              className="h-12 flex-1 rounded-full border border-slate-700 bg-slate-950 px-4 text-base text-white outline-none transition focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-blue-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Connecting..." : "Connect League"}
            </button>
          </div>

          {isLoading ? (
            <div className="mt-5 flex items-center justify-center gap-3 text-sm text-slate-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              Importing league data...
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

          {leagueData ? (
            <div className="mt-6 w-full space-y-6 text-left">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-inner">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                  Connected League
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {leagueData.name}
                </h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">Season</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {leagueData.season}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">Status</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {leagueData.status}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">Total Rosters</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {leagueData.total_rosters}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">League ID</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {leagueId.trim()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">League</h3>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-blue-300">
                      Overview
                    </span>
                  </div>
                  <dl className="mt-5 space-y-4 text-sm text-slate-300">
                    <div>
                      <dt className="text-slate-400">Name</dt>
                      <dd className="mt-1 font-medium text-white">{leagueData.name}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Season</dt>
                      <dd className="mt-1 font-medium text-white">{leagueData.season}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Status</dt>
                      <dd className="mt-1 font-medium text-white">{leagueData.status}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Total Rosters</dt>
                      <dd className="mt-1 font-medium text-white">{leagueData.total_rosters}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Owners</h3>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
                      {owners.length}
                    </span>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-950/80 text-slate-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">Display Name</th>
                          <th className="px-4 py-3 font-medium">User ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {owners.map((user) => (
                          <tr key={user.user_id} className="border-t border-slate-800 bg-slate-900/50">
                            <td className="px-4 py-3 text-white">
                              {user.display_name || user.username || user.user_id}
                            </td>
                            <td className="px-4 py-3 text-slate-400">{user.user_id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Rosters</h3>
                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-300">
                      {rosters.length}
                    </span>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-950/80 text-slate-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">Roster ID</th>
                          <th className="px-4 py-3 font-medium">Owner Name</th>
                          <th className="px-4 py-3 font-medium"># Players</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rosters.map((roster) => {
                          const owner = ownerLookup[roster.owner_id];
                          const ownerName = owner?.display_name || owner?.username || roster.owner_id;

                          return (
                            <tr key={roster.roster_id} className="border-t border-slate-800 bg-slate-900/50">
                              <td className="px-4 py-3 text-white">{roster.roster_id}</td>
                              <td className="px-4 py-3 text-white">{ownerName}</td>
                              <td className="px-4 py-3 text-slate-400">{roster.players?.length ?? 0}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </form>

        <p className="mt-4 text-sm text-slate-500">
          ESPN and Yahoo support coming soon.
        </p>
      </div>
    </main>
  );
}