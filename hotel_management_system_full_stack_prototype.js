// =====================================================
// HOTEL MANAGEMENT SYSTEM (REFINED STRUCTURE)
// Cleaner component decomposition + shared API logic
// =====================================================

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = token;
  return config;
});

export default function App() {
  const [auth, setAuth] = useState(() => ({
    role: localStorage.getItem("role"),
    token: localStorage.getItem("token"),
  }));

  const onLogin = ({ token, role }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    setAuth({ token, role });
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setAuth({ token: null, role: null });
  };

  const ActivePage = useMemo(() => {
    return {
      admin: AdminDashboard,
      frontdesk: FrontDesk,
      kitchen: Kitchen,
      housekeeping: Housekeeping,
    }[auth.role] || null;
  }, [auth.role]);

  if (!auth.role) {
    return <Login onLogin={onLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar role={auth.role} onLogout={onLogout} />
      <main className="flex-1 p-6">
        {ActivePage ? <ActivePage /> : <UnsupportedRole role={auth.role} />}
      </main>
    </div>
  );
}

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await api.post("/login", { username, password });
      onLogin({ token: response.data.token, role: response.data.role });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <h1 className="text-3xl font-bold mb-6 text-center">Luxury Hotel</h1>

        <label className="block mb-4">
          <span className="text-sm text-gray-600">Username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full p-3 mt-1 border rounded"
            placeholder="Type your username"
            aria-label="Username"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-gray-600">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full p-3 mt-1 border rounded"
            placeholder="Type your password"
            aria-label="Password"
          />
        </label>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black text-white p-3 rounded disabled:opacity-50"
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </motion.form>
    </div>
  );
}

function Sidebar({ role, onLogout }) {
  const menuItems = ["Dashboard", "Bookings", "Inventory", "Rooms"];

  return (
    <aside className="w-64 bg-black text-white p-6 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-6">Hotel System</h2>
        <p className="text-sm text-gray-300 mb-8">Role: {role}</p>
        <ul className="space-y-3">
          {menuItems.map((item) => (
            <li key={item} className="rounded px-3 py-2 hover:bg-gray-800 cursor-pointer">
              {item}
            </li>
          ))}
        </ul>
      </div>
      <button onClick={onLogout} className="bg-gray-800 p-3 rounded hover:bg-gray-700">
        Logout
      </button>
    </aside>
  );
}

function useApiData(endpoint, initialData) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(endpoint);
        if (active) setData(response.data);
      } catch (err) {
        if (active) setError(extractErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [endpoint]);

  return { data, loading, error };
}

function extractErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.statusText ||
    error?.message ||
    "Something went wrong."
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function AdminDashboard() {
  const { data, loading, error } = useApiData("/admin/dashboard", {
    totalBookings: 0,
    totalRooms: 0,
    totalSales: 0,
    revenueTrend: [],
  });

  const chartData = data.revenueTrend?.length
    ? data.revenueTrend
    : [
        { day: "Mon", revenue: 200 },
        { day: "Tue", revenue: 400 },
        { day: "Wed", revenue: 350 },
        { day: "Thu", revenue: 500 },
        { day: "Fri", revenue: 700 },
      ];

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of bookings, rooms, and revenue.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard title="Bookings" value={data.totalBookings} loading={loading} />
        <StatCard title="Rooms" value={data.totalRooms} loading={loading} />
        <StatCard title="Revenue" value={formatCurrency(data.totalSales)} loading={loading} />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Revenue Overview</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading analytics...</div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <XAxis dataKey="day" stroke="#8884d8" />
              <YAxis stroke="#8884d8" />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function StatCard({ title, value, loading }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="bg-white p-6 rounded-2xl shadow min-h-[120px]">
      <p className="text-gray-500">{title}</p>
      <h2 className="text-3xl font-bold mt-3">{loading ? "—" : value || 0}</h2>
    </motion.div>
  );
}

function FrontDesk() {
  const { data: bookings, loading, error } = useApiData("/bookings", []);

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Booking Management</h1>
        <p className="text-gray-500 mt-1">Review current guest stays and room assignments.</p>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-sm uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Check-In</th>
              <th className="px-4 py-3">Check-Out</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">
                  Loading bookings...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-red-600">
                  {error}
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">
                  No bookings found.
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id || booking._id || `${booking.roomId}-${booking.checkIn}`} className="border-t text-sm text-gray-700">
                  <td className="px-4 py-4">{booking.guestName}</td>
                  <td className="px-4 py-4">{booking.roomId}</td>
                  <td className="px-4 py-4">{formatDate(booking.checkIn)}</td>
                  <td className="px-4 py-4">{formatDate(booking.checkOut)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Kitchen() {
  const { data: items, loading, error } = useApiData("/inventory/kitchen", []);

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Kitchen Inventory</h1>
        <p className="text-gray-500 mt-1">Track stock levels for kitchen supplies and ingredients.</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">Loading inventory...</div>
      ) : error ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-red-600">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id || item._id || item.name} className="bg-white p-5 rounded-2xl shadow flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{item.name}</h2>
                <p className="text-sm text-gray-500">{item.category || "Kitchen item"}</p>
              </div>
              <span className="text-lg font-bold">{item.quantity}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Housekeeping() {
  const { data: rooms, loading, error } = useApiData("/rooms", []);

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Room Status</h1>
        <p className="text-gray-500 mt-1">Monitor cleaning and occupancy status for all rooms.</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">Loading room status...</div>
      ) : error ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-red-600">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <motion.div
              key={room.id || room._id || room.number}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-5 rounded-2xl shadow"
            >
              <h2 className="font-bold">Room {room.number}</h2>
              <p className="text-gray-600 mt-2">Status: {room.status}</p>
              <p className="text-sm text-gray-500 mt-1">Housekeeping: {room.housekeepingStatus || "Pending"}</p>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

function UnsupportedRole({ role }) {
  return (
    <div className="bg-white rounded-2xl p-10 shadow text-center">
      <h1 className="text-2xl font-bold">Unsupported Role</h1>
      <p className="text-gray-500 mt-4">The role "{role}" does not have a configured dashboard yet.</p>
    </div>
  );
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "—";
  }
}

// =====================================================
// Notes:
// - Shared API client with interceptors
// - Reusable data hook for loading/error states
// - Improved form handling and accessibility
// - Safer list keys and fallback UI states
// =====================================================

