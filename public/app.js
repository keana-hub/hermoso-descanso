const { useState, useEffect } = React;
const API = window.location.origin + "/api"; // Dynamically use current domain

console.log("API endpoint:", API);

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchApi(endpoint, token) {
  const response = await fetch(`${API}${endpoint}`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to fetch ${endpoint}`);
  }
  return response.json();
}

const kitchenMenu = [
  { category: "Main Dish", name: "Grilled chicken with steamed vegetables", price: 180 },
  { category: "Main Dish", name: "Beef stir-fry with broccoli and rice", price: 190 },
  { category: "Main Dish", name: "Pork adobo with garlic rice", price: 170 },
  { category: "Main Dish", name: "Lamb stew with carrots and potatoes", price: 200 },
  { category: "Main Dish", name: "Fried fish with sautéed vegetables", price: 175 },
  { category: "Main Dish", name: "Shrimp pasta in cream sauce", price: 185 },
  { category: "Soup", name: "Chicken noodle soup", price: 95 },
  { category: "Soup", name: "Beef vegetable soup", price: 100 },
  { category: "Soup", name: "Creamy mushroom soup", price: 105 },
  { category: "Soup", name: "Tomato basil soup", price: 90 },
  { category: "Soup", name: "Seafood chowder", price: 125 },
  { category: "Soup", name: "Pumpkin soup", price: 95 },
  { category: "Appetizer", name: "Fried dumplings with soy sauce", price: 75 },
  { category: "Appetizer", name: "Fresh vegetable salad with vinaigrette", price: 70 },
  { category: "Appetizer", name: "Garlic butter shrimp", price: 110 },
  { category: "Appetizer", name: "Cheese sticks", price: 65 },
  { category: "Appetizer", name: "Bruschetta with tomatoes", price: 80 },
  { category: "Appetizer", name: "Spring rolls", price: 75 },
  { category: "Dessert", name: "Chocolate cake", price: 90 },
  { category: "Dessert", name: "Vanilla cupcakes", price: 85 },
  { category: "Dessert", name: "Fruit salad with cream", price: 70 },
  { category: "Dessert", name: "Mango pudding", price: 80 },
  { category: "Dessert", name: "Banana bread", price: 75 },
  { category: "Dessert", name: "Yogurt parfait", price: 85 },
  { category: "Combination", name: "Fried chicken meal with rice and gravy", price: 220 },
  { category: "Combination", name: "Burger with fries and soft drink", price: 210 },
  { category: "Combination", name: "Spaghetti with garlic bread and juice", price: 205 },
  { category: "Combination", name: "Grilled fish with rice and soup", price: 225 },
  { category: "Combination", name: "Steak with mashed potatoes and salad", price: 240 },
  { category: "Combination", name: "Seafood platter with dipping sauces", price: 260 },
];

function FrontPage({ onLogin, error, clockStatus, clockName, setClockName, clockRole, setClockRole, onClockIn, onClockOut, clockLogs, clockNotice }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const roleOptions = ["frontdesk", "housekeeping", "kitchen", "admin"];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    await onLogin(username, password);
    setIsSubmitting(false);
  };

  return (
    <div className="container">
      <div
        className="card"
        style={{
          position: "relative",
          color: "white",
          overflow: "hidden",
          backgroundImage: "url('https://wallpapers.com/images/featured/hotel-pictures-o9d1lk0gt8hdf0ws.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: 320,
          marginBottom: 24,
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.55)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "40px 32px" }}>
          <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>Hermoso Descanso</h1>
          <p style={{ maxWidth: 620, color: "#e5e7eb", lineHeight: 1.75 }}>
            Manage staff attendance, reservations, inventory and sales with a refined experience.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
        <div className="card">
          <h2>Staff Time Clock</h2>
          <p>Enter your name and department, then clock in or out.</p>
          <label>
            Name
            <input value={clockName} onChange={(e) => setClockName(e.target.value)} placeholder="Enter full name" />
          </label>
          <label>
            Role
            <select value={clockRole} onChange={(e) => setClockRole(e.target.value)}>
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <button className="button" onClick={onClockIn} style={{ background: "#059669" }}>
              Clock In
            </button>
            <button className="button" onClick={onClockOut} style={{ background: "#dc2626" }}>
              Clock Out
            </button>
          </div>
          <p style={{ marginTop: 16, color: "#6b7280" }}>
            Status: <strong>{clockStatus === "in" ? "Clocked In" : "Clocked Out"}</strong>
          </p>
          {clockNotice && <p style={{ color: "#065f46" }}>{clockNotice}</p>}
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}
        </div>

        <div className="card">
          <h2>Staff Login</h2>
          <form onSubmit={handleSubmit}>
            <label>
              Username
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <button className="button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
            {error && <p style={{ color: "#dc2626", marginTop: 12 }}>{error}</p>}
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2>Recent Clock Records</h2>
        {clockLogs.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No clock events recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Event</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {clockLogs.map((entry, index) => (
                <tr key={`${entry.timestamp}-${index}`}>
                  <td>{entry.name}</td>
                  <td>{entry.role}</td>
                  <td>{entry.event}</td>
                  <td>{new Date(entry.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Header({ role, user, onLogout }) {
  return (
    <div
      className="card"
      style={{
        marginBottom: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        backgroundImage: "url('https://wallpapers.com/images/featured/hotel-pictures-o9d1lk0gt8hdf0ws.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        minHeight: 140,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.6)" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <h2 style={{ margin: 0 }}>Hermoso Descanso</h2>
        <p style={{ color: "#d1d5db", margin: "8px 0 0" }}>Welcome back, {user || role}. Manage operations in one polished view.</p>
        <p style={{ color: "#d1d5db", margin: "8px 0 0", fontSize: "0.9rem" }}>Department: {role}</p>
      </div>
      <button className="button" onClick={onLogout} style={{ zIndex: 1, background: "rgba(255,255,255,0.18)", color: "white", border: "1px solid rgba(255,255,255,0.35)" }}>
        Logout
      </button>
    </div>
  );
}

function StatBlock({ title, value, loading }) {
  return (
    <div className="card" style={{ minHeight: 120 }}>
      <p style={{ color: "#6b7280", marginBottom: 8 }}>{title}</p>
      <h1>{loading ? "Loading..." : value}</h1>
    </div>
  );
}

function AdminDashboard({ token, onOpenMessages }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [salesReport, setSalesReport] = useState(null);
  const [showSalesReport, setShowSalesReport] = useState(false);
  const [loginLogs, setLoginLogs] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [showTracking, setShowTracking] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [token]);

  const loadAllData = async () => {
    try {
      const [dashboard, report, logs, attendance] = await Promise.all([
        fetchApi("/admin/dashboard", token),
        fetchApi("/sales/report", token),
        fetchApi("/login-logs", token).catch(() => []),
        fetchApi("/attendance/logs", token).catch(() => []),
      ]);
      setStats(dashboard);
      setSalesReport(report);
      setLoginLogs(logs);
      setAttendanceLogs(attendance);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const printSalesReport = () => {
    if (!salesReport) return;
    const printWindow = window.open("", "SalesReport", "width=1000,height=1200");
    if (!printWindow) return;

    const html = `<!DOCTYPE html>
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0 0 5px 0; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #111827; color: white; padding: 12px; text-align: left; font-weight: bold; }
            td { padding: 12px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9fafb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sales Report</h1>
            <p>Total Sales: $${salesReport.totalSales.toFixed(2)}</p>
          </div>
          <table>
            <thead><tr><th>Description</th><th>Category</th><th>Payment</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>
              ${salesReport.sales.map(sale => `<tr><td>${sale.description}</td><td>${sale.category}</td><td>${sale.paymentMethod || "N/A"}</td><td>$${sale.amount.toFixed(2)}</td><td>${new Date(sale.date).toLocaleDateString()}</td></tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2>Admin Dashboard</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="button" onClick={() => setShowSalesReport(!showSalesReport)}>
            {showSalesReport ? "Hide" : "Show"} Sales
          </button>
          <button className="button" onClick={() => setShowTracking(!showTracking)} style={{ background: "#0891b2" }}>
            {showTracking ? "Hide" : "Show"} Tracking
          </button>
          <button className="button" onClick={onOpenMessages} style={{ background: "#8b5cf6" }}>
            Open Messages
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginBottom: 24 }}>
        <StatBlock title="Bookings" value={stats?.totalBookings ?? "..."} loading={loading} />
        <StatBlock title="Rooms" value={stats?.totalRooms ?? "..."} loading={loading} />
        <StatBlock title="Revenue" value={stats ? `$${stats.totalSales}` : "..."} loading={loading} />
        <StatBlock title="Login Events" value={loginLogs.length} loading={loading} />
      </div>

      {showSalesReport && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3>Sales Report</h3>
            <button className="button" onClick={printSalesReport} style={{ background: "#059669" }}>
              Print A4 Report
            </button>
          </div>

          {loading && <p>Loading report...</p>}
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}
          {!loading && !error && salesReport && (
            <div>
              <h4>Sales by Category</h4>
              <table style={{ marginBottom: 24 }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    <th style={{ textAlign: "left", padding: 12 }}>Category</th>
                    <th style={{ textAlign: "right", padding: 12 }}>Amount</th>
                    <th style={{ textAlign: "right", padding: 12 }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(salesReport.salesByCategory).map(([category, data]) => (
                    <tr key={category} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: 12 }}>{category}</td>
                      <td style={{ textAlign: "right", padding: 12 }}>$${data.amount.toFixed(2)}</td>
                      <td style={{ textAlign: "right", padding: 12 }}>{((data.amount / salesReport.totalSales) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4>Recent Transactions</h4>
              <table>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    <th style={{ textAlign: "left", padding: 12 }}>Description</th>
                    <th style={{ textAlign: "left", padding: 12 }}>Category</th>
                    <th style={{ textAlign: "left", padding: 12 }}>Payment</th>
                    <th style={{ textAlign: "right", padding: 12 }}>Amount</th>
                    <th style={{ textAlign: "left", padding: 12 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {salesReport.sales.slice(0, 20).map((sale, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: 12 }}>{sale.description}</td>
                      <td style={{ padding: 12 }}>{sale.category}</td>
                      <td style={{ padding: 12 }}>{sale.paymentMethod || "N/A"}</td>
                      <td style={{ textAlign: "right", padding: 12 }}>$${sale.amount.toFixed(2)}</td>
                      <td style={{ padding: 12 }}>{new Date(sale.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showTracking && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div className="card">
            <h3>Login Logs</h3>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {loginLogs.slice(0, 20).map((log, i) => (
                <div key={i} style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontSize: "0.9rem" }}>
                  <div><strong>{log.username}</strong> ({log.role})</div>
                  <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                    {new Date(log.loginTime).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Clock In/Out Logs</h3>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {attendanceLogs.slice(0, 20).map((log, i) => (
                <div key={i} style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontSize: "0.9rem" }}>
                  <div><strong>{log.username}</strong> ({log.role})</div>
                  <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                    In: {new Date(log.clockInTime).toLocaleTimeString()}
                    {log.clockOutTime && ` → Out: ${new Date(log.clockOutTime).toLocaleTimeString()}`}
                  </div>
                  {log.duration && <div style={{ color: "#059669", fontSize: "0.85rem" }}>Duration: {Math.floor(log.duration / 60)}h {log.duration % 60}m</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReservationPage({ token, onOpenMessages }) {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [reservation, setReservation] = useState({
    guestName: "",
    email: "",
    contact: "",
    roomId: "",
    checkIn: "",
    checkOut: "",
    paymentMethod: "",
  });

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const [bData, rData] = await Promise.all([
        fetchApi("/bookings", token),
        fetchApi("/rooms", token),
      ]);
      setBookings(bData);
      setRooms(rData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify(reservation),
      });
      if (!response.ok) throw new Error("Failed to create reservation");
      setReservation({ guestName: "", email: "", contact: "", roomId: "", checkIn: "", checkOut: "", paymentMethod: "" });
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const [messageTarget, setMessageTarget] = useState("housekeeping");

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    try {
      await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({
          toRole: "housekeeping",
          message: messageText,
          regarding: selectedRoom ? `Room ${selectedRoom.number} request` : "Room Status or Cleaning Request",
          roomId: selectedRoom ? selectedRoom.number : undefined,
        }),
      });
      setMessageText("");
      setSelectedRoom(null);
      setMessageTarget("housekeeping");
      setShowMessage(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const getRoomStatus = (roomNum) => {
    const booking = bookings.find((b) => b.roomId === roomNum.toString() && b.status === "active");
    return booking ? "Occupied" : "Available";
  };

  const messageRoom = (room) => {
    setSelectedRoom(room);
    setMessageTarget("housekeeping");
    setMessageText(`Please check room ${room.number} for cleaning or guest request.`);
    setShowMessage(true);
  };

  const markRoomCleaned = async (roomId) => {
    try {
      await fetch(`${API}/rooms/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ housekeepingStatus: "Clean" }),
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const markRoomNeedsCleaning = async (roomId) => {
    try {
      await fetch(`${API}/rooms/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ housekeepingStatus: "Needs Cleaning" }),
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const allRooms = Array.from({ length: 150 }, (_, idx) => {
    const roomNumber = idx + 1;
    const existingRoom = rooms.find((room) => room.number === roomNumber);
    return (
      existingRoom ||
      {
        _id: `placeholder-${roomNumber}`,
        number: roomNumber,
        housekeepingStatus: "Unknown",
        placeholder: true,
      }
    );
  });

  const filteredRooms = filterStatus === "all" ? allRooms : allRooms.filter((r) => getRoomStatus(r.number) === filterStatus);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2>Room Management (150 Rooms)</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="button" onClick={() => setShowForm(!showForm)}>
            New Reservation
          </button>
          <button className="button" onClick={() => { setSelectedRoom(null); setMessageTarget("housekeeping"); setMessageText(""); setShowMessage(!showMessage); }} style={{ background: "#0891b2" }}>
            Message Housekeeping
          </button>
          <button className="button" onClick={onOpenMessages} style={{ background: "#8b5cf6" }}>
            Messages
          </button>
        </div>
      </div>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {showMessage && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>{selectedRoom ? `Message about Room ${selectedRoom.number}` : "Message Housekeeping"}</h3>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={messageTarget === "room" ? "Enter your message for the guest room..." : "Enter your message about room status or cleaning requests..."}
            style={{ width: "100%", minHeight: 80, padding: 12, border: "1px solid #d1d5db", borderRadius: 8, marginBottom: 8 }}
          />
          <button className="button" onClick={sendMessage} style={{ background: "#059669", marginRight: 8 }}>
            Send
          </button>
          <button className="button" onClick={() => setShowMessage(false)} style={{ background: "#6b7280" }}>
            Cancel
          </button>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Create Reservation</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <label>
                Guest Name
                <input value={reservation.guestName} onChange={(e) => setReservation({ ...reservation, guestName: e.target.value })} required />
              </label>
              <label>
                Email
                <input type="email" value={reservation.email} onChange={(e) => setReservation({ ...reservation, email: e.target.value })} required />
              </label>
              <label>
                Contact
                <input value={reservation.contact} onChange={(e) => setReservation({ ...reservation, contact: e.target.value })} required />
              </label>
              <label>
                Room (1-150)
                <select value={reservation.roomId} onChange={(e) => setReservation({ ...reservation, roomId: e.target.value })} required>
                  <option value="">Select Room</option>
                  {Array.from({ length: 150 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num} disabled={getRoomStatus(num) !== "Available"}>
                      {num} - {getRoomStatus(num)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Check-In
                <input type="date" value={reservation.checkIn} onChange={(e) => setReservation({ ...reservation, checkIn: e.target.value })} required />
              </label>
              <label>
                Check-Out
                <input type="date" value={reservation.checkOut} onChange={(e) => setReservation({ ...reservation, checkOut: e.target.value })} required />
              </label>
              <label>
                Payment
                <select value={reservation.paymentMethod} onChange={(e) => setReservation({ ...reservation, paymentMethod: e.target.value })} required>
                  <option value="">Select Payment</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="GCash">GCash</option>
                </select>
              </label>
            </div>

            {reservation.paymentMethod === "Card" && (
              <div style={{ marginTop: 16, padding: 16, background: "#eef2ff", borderRadius: 12, border: "1px solid #c7d2fe", color: "#3730a3" }}>
                <strong>Card Reader Ready</strong><br />
                Please have the guest swipe, insert, or tap their card.
              </div>
            )}

            {reservation.paymentMethod === "GCash" && (
              <div style={{ marginTop: 16, padding: 16, background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0", color: "#166534" }}>
                <strong>GCash QR Code</strong><br />
                <div style={{ marginTop: 8, textAlign: "center" }}>
                  <div style={{ display: "inline-block", padding: 20, background: "white", border: "2px solid #166534", borderRadius: 8 }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#166534" }}>QR</div>
                    <div style={{ fontSize: "12px", marginTop: 4 }}>Scan to Pay</div>
                  </div>
                </div>
                <p style={{ marginTop: 8, fontSize: "0.9rem" }}>Ask the guest to scan this QR code with their GCash app to complete payment.</p>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <button className="button" type="submit">Create Reservation</button>
              <button className="button" type="button" onClick={() => setShowForm(false)} style={{ marginLeft: 8, background: "#6b7280" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 16, display: "inline-block" }}>
          Filter:
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ marginLeft: 8, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
          >
            <option value="all">All Rooms</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p>Loading rooms...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Room #</th>
                <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Status</th>
                <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Housekeeping</th>
                <th style={{ padding: 12, textAlign: "center", borderBottom: "2px solid #e5e7eb" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.slice(0, 50).map((room) => (
                <tr key={room._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: 12 }}><strong>Room {room.number}</strong></td>
                  <td style={{ padding: 12 }}>
                    <span style={{ padding: "4px 8px", borderRadius: 4, background: getRoomStatus(room.number) === "Occupied" ? "#fecaca" : "#dcfce7", fontSize: "0.9rem" }}>
                      {room.placeholder ? "No Room Record" : getRoomStatus(room.number)}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{ fontSize: "0.9rem", color: room.housekeepingStatus === "Clean" ? "#059669" : "#dc2626" }}>
                      {room.housekeepingStatus}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <button
                      className="button"
                      onClick={() => markRoomCleaned(room._id)}
                      disabled={room.placeholder}
                      style={{ fontSize: "0.75rem", padding: "4px 8px", marginRight: 4, background: "#10b981" }}
                    >
                      Cleaned
                    </button>
                    <button
                      className="button"
                      onClick={() => markRoomNeedsCleaning(room._id)}
                      disabled={room.placeholder}
                      style={{ fontSize: "0.75rem", padding: "4px 8px", marginRight: 4, background: "#ef4444" }}
                    >
                      Needs Cleaning
                    </button>
                    <button
                      className="button"
                      onClick={() => messageRoom(room)}
                      style={{ fontSize: "0.75rem", padding: "4px 8px", background: "#0891b2" }}
                    >
                      Message
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: "#6b7280", marginTop: 16, fontSize: "0.9rem" }}>
            Showing {filteredRooms.slice(0, 50).length} of {filteredRooms.length} rooms (scroll for more or use the filter)
          </p>
        </div>
      )}
    </div>
  );
}

function Kitchen({ token, onOpenMessages }) {
  const [tools, setTools] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const inventory = await fetchApi("/inventory", token);
      const kitchenInventory = inventory.filter((item) => item.category && item.category.toLowerCase().includes("kitchen"));
      const kitchenTools = kitchenInventory.filter((item) => item.category.toLowerCase().includes("tool") || item.category.toLowerCase().includes("cookware") || item.category.toLowerCase().includes("equipment") || item.category.toLowerCase().includes("supplies"));
      const kitchenIngredients = kitchenInventory.filter((item) => !item.category.toLowerCase().includes("tool") && !item.category.toLowerCase().includes("cookware") && !item.category.toLowerCase().includes("equipment") && !item.category.toLowerCase().includes("supplies"));
      setTools(kitchenTools);
      setIngredients(kitchenIngredients);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateInventory = async (itemId, newQuantity) => {
    try {
      await fetch(`${API}/inventory/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ quantity: parseInt(newQuantity) }),
      });
      setEditingItem(null);
      setEditQuantity("");
      loadData(); // Reload data
    } catch (err) {
      setError("Failed to update inventory");
    }
  };

  const startEditing = (item) => {
    setEditingItem(item._id);
    setEditQuantity(item.quantity.toString());
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditQuantity("");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
      <div>
        <POSSystem token={token} />
      </div>

      <div className="card" style={{ position: "sticky", top: 24, height: "fit-content", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3>Inventory</h3>
          <button className="button" onClick={onOpenMessages} style={{ background: "#8b5cf6", fontSize: "0.8rem", padding: "6px 12px" }}>Messages</button>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div>
        {error && <p style={{ color: "#dc2626", marginBottom: 16 }}>{error}</p>}
        <h4 style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: 0, marginBottom: 12 }}>Tools</h4>
        <ul style={{ listStyle: "none", padding: 0, marginBottom: 16 }}>
          {tools.map((item) => (
            <li key={item._id} style={{ padding: "8px 0", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
              <span>{item.name}</span>
              {editingItem === item._id ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    style={{ width: 60, padding: "4px", border: "1px solid #d1d5db", borderRadius: 4 }}
                  />
                  <button className="button" onClick={() => updateInventory(item._id, editQuantity)} style={{ fontSize: "0.8rem", padding: "4px 8px" }}>Save</button>
                  <button className="button" onClick={cancelEditing} style={{ fontSize: "0.8rem", padding: "4px 8px", background: "#6b7280" }}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ color: "#059669" }}>{item.quantity}</strong>
                  <button className="button" onClick={() => startEditing(item)} style={{ fontSize: "0.8rem", padding: "2px 6px" }}>Edit</button>
                </div>
              )}
            </li>
          ))}
        </ul>
        <h4 style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: 0, marginBottom: 12 }}>Ingredients</h4>
        <div>
          {Object.entries(
            ingredients.reduce((acc, item) => {
              const cat = item.category.replace("Kitchen ", "");
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(item);
              return acc;
            }, {})
          ).map(([category, categoryItems]) => (
            <div key={category} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1f2937", marginBottom: 8 }}>{category}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {categoryItems.map((item) => (
                  <li key={item._id} style={{ padding: "6px 0", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
                    <span>{item.name}</span>
                    {editingItem === item._id ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="number"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          style={{ width: 50, padding: "4px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: "0.85rem" }}
                        />
                        <button className="button" onClick={() => updateInventory(item._id, editQuantity)} style={{ fontSize: "0.75rem", padding: "3px 6px" }}>✓</button>
                        <button className="button" onClick={cancelEditing} style={{ fontSize: "0.75rem", padding: "3px 6px", background: "#6b7280" }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <strong style={{ color: "#0891b2", fontSize: "0.85rem" }}>{item.quantity}</strong>
                        <button className="button" onClick={() => startEditing(item)} style={{ fontSize: "0.7rem", padding: "2px 5px" }}>Edit</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Housekeeping({ token, onOpenMessages }) {
  const [rooms, setRooms] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const [rData, iData] = await Promise.all([
        fetchApi("/rooms", token),
        fetchApi("/inventory", token),
      ]);
      setRooms(rData);
      const housekeepingItems = iData.filter((item) => item.category && item.category.toLowerCase().includes("housekeeping"));
      setInventory(housekeepingItems.length ? housekeepingItems : iData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (roomId, status) => {
    try {
      await fetch(`${API}/rooms/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ housekeepingStatus: status }),
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    try {
      await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({
          fromRole: "housekeeping",
          toRole: "frontdesk",
          message: messageText,
          regarding: "Room Status Update",
        }),
      });
      setMessageText("");
      setShowMessage(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = filterStatus === "all" ? rooms : rooms.filter((r) => r.housekeepingStatus === filterStatus);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
      <div>
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Housekeeping Management</h2>
          <button className="button" onClick={() => setShowMessage(!showMessage)} style={{ background: "#0891b2", fontSize: "0.9rem" }}>
            Message Frontdesk
          </button>
          <button className="button" onClick={onOpenMessages} style={{ background: "#8b5cf6", fontSize: "0.9rem" }}>
            Messages
          </button>
        </div>

        {error && <p style={{ color: "#dc2626", marginBottom: 16, padding: "12px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>{error}</p>}

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {["all", "Clean", "Pending", "Needs Cleaning", "In Progress"].map((status) => (
            <button
              key={status}
              className="button"
              onClick={() => setFilterStatus(status)}
              style={{
                background: filterStatus === status ? "#111827" : "#6b7280",
                fontSize: "0.85rem",
                padding: "8px 12px",
                transition: "all 0.2s ease"
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {showMessage && (
          <div className="card" style={{ marginBottom: 20, animation: "slideDown 0.3s ease-out" }}>
            <h4>Send Message to Frontdesk</h4>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Enter your message..."
              style={{ width: "100%", minHeight: 80, padding: 12, border: "2px solid #e5e7eb", borderRadius: 10, marginBottom: 12, fontSize: "0.95rem" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="button" onClick={sendMessage} style={{ background: "#059669", flex: 1 }}>
                Send Message
              </button>
              <button className="button" onClick={() => setShowMessage(false)} style={{ background: "#6b7280" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {loading ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
              <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>Loading rooms...</p>
            </div>
          ) : (
            filtered.map((room, index) => (
              <div
                key={room._id}
                className="card"
                style={{
                  animation: `fadeIn 0.4s ease-out ${index * 0.05}s both`
                }}
              >
                <h4 style={{ margin: "0 0 12px 0", color: "#111827" }}>Room {room.number}</h4>
                <div style={{ marginBottom: 12 }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "0.9rem", color: "#6b7280" }}>
                    <strong>Status:</strong>
                    <span style={{
                      color: room.housekeepingStatus === "Clean" ? "#059669" : room.housekeepingStatus === "In Progress" ? "#f59e0b" : "#dc2626",
                      marginLeft: 8,
                      fontWeight: "500"
                    }}>
                      {room.housekeepingStatus}
                    </span>
                  </p>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#6b7280" }}>
                    <strong>Room Status:</strong>
                    <span style={{ marginLeft: 8, color: "#374151" }}>{room.status}</span>
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    className="button"
                    onClick={() => updateStatus(room._id, "In Progress")}
                    style={{
                      fontSize: "0.75rem",
                      padding: "6px 10px",
                      background: "#f59e0b",
                      flex: "1 1 auto"
                    }}
                  >
                    In Progress
                  </button>
                  <button
                    className="button"
                    onClick={() => updateStatus(room._id, "Clean")}
                    style={{
                      fontSize: "0.75rem",
                      padding: "6px 10px",
                      background: "#10b981",
                      flex: "1 1 auto"
                    }}
                  >
                    Clean
                  </button>
                  <button
                    className="button"
                    onClick={() => updateStatus(room._id, "Needs Cleaning")}
                    style={{
                      fontSize: "0.75rem",
                      padding: "6px 10px",
                      background: "#ef4444",
                      flex: "1 1 auto"
                    }}
                  >
                    Needs Cleaning
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ height: "fit-content", maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 16px 0", color: "#111827" }}>Inventory</h3>
        {loading ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "20px" }}>Loading inventory...</p>
        ) : inventory.length === 0 ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "20px" }}>No inventory items</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {inventory.map((item, index) => (
              <li
                key={item._id}
                style={{
                  padding: "12px 0",
                  borderBottom: index < inventory.length - 1 ? "1px solid #f1f5f9" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.9rem",
                  transition: "background 0.2s ease"
                }}
                onMouseEnter={(e) => e.target.style.background = "#f8fafc"}
                onMouseLeave={(e) => e.target.style.background = "transparent"}
              >
                <span style={{ color: "#374151", flex: 1 }}>{item.name}</span>
                <strong style={{
                  color: item.quantity < 20 ? "#dc2626" : item.quantity < 50 ? "#f59e0b" : "#059669",
                  background: item.quantity < 20 ? "#fef2f2" : item.quantity < 50 ? "#fffbeb" : "#f0fdf4",
                  padding: "2px 8px",
                  borderRadius: 12,
                  fontSize: "0.8rem"
                }}>
                  {item.quantity}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MessageSidebar({ token, role, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedRole, setSelectedRole] = useState("frontdesk");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const roles = {
    "frontdesk": ["kitchen", "housekeeping", "admin", "room"],
    "kitchen": ["frontdesk", "housekeeping", "admin"],
    "housekeeping": ["frontdesk", "kitchen", "admin"],
    "admin": ["frontdesk", "kitchen", "housekeeping", "room"],
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const loadMessages = async () => {
    try {
      const data = await fetchApi("/contact/messages", token);
      setMessages(data);
      const unread = data.filter(m => !m.read && m.toRole === role).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setLoading(true);
    try {
      await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({
          toRole: selectedRole,
          message: newMessage,
          regarding: "General Update",
        }),
      });
      setNewMessage("");
      loadMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (msgId) => {
    try {
      await fetch(`${API}/contact/${msgId}/read`, {
        method: "PUT",
        headers: authHeaders(token),
      });
      loadMessages();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const roleMessages = messages.filter(m => m.fromRole === selectedRole || m.toRole === selectedRole);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: 420, maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: "20px",
          background: "linear-gradient(135deg, #1f2937 0%, #374151 100%)",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: "16px 16px 0 0"
        }}>
          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "600" }}>
            Messages
            {unreadCount > 0 && (
              <span style={{
                background: "#ef4444",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 12,
                fontSize: "0.8rem",
                fontWeight: "bold",
                animation: "pulse 2s infinite"
              }}>
                {unreadCount}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "8px",
              transition: "background 0.2s ease"
            }}
            onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={(e) => e.target.style.background = "none"}
          >
            ×
          </button>
        </div>

        <div style={{
          padding: "16px",
          borderBottom: "1px solid #e5e7eb",
          maxHeight: 320,
          overflowY: "auto",
          background: "#f8fafc"
        }}>
          {roleMessages.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280", margin: "40px 0", fontStyle: "italic" }}>
              No messages yet
            </p>
          ) : (
            roleMessages.map((msg, index) => (
              <div
                key={msg._id}
                style={{
                  padding: "12px",
                  marginBottom: 12,
                  background: msg.read ? "#ffffff" : "#dbeafe",
                  borderRadius: 12,
                  cursor: "pointer",
                  border: "1px solid #e5e7eb",
                  transition: "all 0.2s ease",
                  animation: `slideUp 0.3s ease-out ${index * 0.1}s both`
                }}
                onClick={() => !msg.read && markAsRead(msg._id)}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 6, fontWeight: "500" }}>
                  <strong style={{ color: "#374151" }}>{msg.fromRole}</strong> → <strong style={{ color: "#374151" }}>{msg.toRole}</strong>
                </div>
                <p style={{ margin: 0, fontSize: "0.9rem", wordBreak: "break-word", color: "#111827", lineHeight: 1.4 }}>
                  {msg.message}
                </p>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 6 }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: "16px", background: "white" }}>
          <div className="form-group">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                marginBottom: 12,
                border: "2px solid #e5e7eb",
                borderRadius: 10,
                fontSize: "0.9rem",
                background: "white",
                outline: "none",
                transition: "border-color 0.2s ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            >
              {roles[role]?.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ display: "flex", gap: 8 }}>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: "10px 12px",
                border: "2px solid #e5e7eb",
                borderRadius: 10,
                fontSize: "0.9rem",
                resize: "none",
                height: 50,
                outline: "none",
                transition: "border-color 0.2s ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
            <button
              className="button"
              onClick={sendMessage}
              disabled={loading || !newMessage.trim()}
              style={{
                width: 60,
                height: 50,
                padding: 0,
                background: loading ? "#6b7280" : "#3b82f6",
                borderRadius: 10
              }}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function POSSystem({ token }) {
  const [dishes, setDishes] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [orderType, setOrderType] = useState("Dine-In");
  const [roomNumber, setRoomNumber] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderError, setOrderError] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  useEffect(() => {
    loadDishes();
    loadOrders();
  }, [token]);

  const loadDishes = async () => {
    try {
      const data = await fetchApi("/dishes", token);
      setDishes(data);
    } catch (err) {
      console.error("Failed to load dishes:", err);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await fetchApi("/pos/orders", token);
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders:", err);
    }
  };

  const addToCart = (dish) => {
    const existing = cart.find(item => item._id === dish._id);
    if (existing) {
      setCart(cart.map(item =>
        item._id === dish._id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, { ...dish, quantity: 1, subtotal: dish.price }]);
    }
  };

  const removeFromCart = (dishId) => {
    setCart(cart.filter(item => item._id !== dishId));
  };

  const checkout = async () => {
    if (cart.length === 0) return;
    if (orderType === "Room Service" && !roomNumber) {
      setOrderError("Please select a room for room service.");
      return;
    }

    setOrderError("");
    setLoading(true);
    try {
      const items = cart.map(item => ({ dish: item.name, quantity: item.quantity, price: item.price, subtotal: item.subtotal }));
      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      
      const response = await fetch(`${API}/pos/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ items, paymentMethod, totalAmount, orderType, deliveryRoom: roomNumber, notes: orderNotes }),
      });
      
      if (response.ok) {
        const order = await response.json();
        const receiptResponse = await fetch(`${API}/pos/orders/${order._id}/receipt`, { headers: authHeaders(token) });
        const receiptText = await receiptResponse.text();
        const blob = new Blob([receiptText], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt-${order.orderId}.txt`;
        a.click();
        
        setCart([]);
        setOrderNotes("");
        setRoomNumber("");
        loadOrders();
      }
    } catch (err) {
      console.error("Failed to checkout:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const categories = [...new Set(dishes.map(d => d.category))];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
      <div>
        <h3>POS Menu</h3>
        {categories.map(cat => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <h4 style={{ background: "#f3f4f6", padding: 12, marginBottom: 8, borderRadius: 6 }}>{cat}</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {dishes.filter(d => d.category === cat).map(dish => (
                <div key={dish._id} style={{ border: "1px solid #d1d5db", padding: 12, borderRadius: 8, cursor: "pointer", transition: "all 0.2s" }} onClick={() => addToCart(dish)}>
                  <h5 style={{ margin: "0 0 4px 0", fontSize: "0.95rem" }}>{dish.name}</h5>
                  <p style={{ margin: "0 0 8px 0", fontSize: "0.85rem", color: "#6b7280" }}>{dish.description}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", color: "#059669" }}>${dish.price.toFixed(2)}</span>
                    <button className="button" style={{ fontSize: "0.8rem", padding: "4px 8px", background: "#0891b2" }}>Add</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#f9fafb", padding: 16, borderRadius: 12, height: "fit-content", position: "sticky", top: 24 }}>
        <h4>Order Summary</h4>
        <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 16 }}>
          {cart.map(item => (
            <div key={item._id} style={{ display: "flex", justifyContent: "space-between", padding: 8, borderBottom: "1px solid #e5e7eb", fontSize: "0.9rem" }}>
              <div>
                <div>{item.name}</div>
                <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>x{item.quantity}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div>${item.subtotal.toFixed(2)}</div>
                <button className="button" onClick={() => removeFromCart(item._id)} style={{ fontSize: "0.75rem", padding: "2px 6px", background: "#ef4444", marginTop: 4 }}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "2px solid #d1d5db", paddingTop: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginBottom: 8 }}>
            <span>Total:</span>
            <span style={{ color: "#059669" }}>${totalPrice.toFixed(2)}</span>
          </div>

          <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
            <label style={{ display: "block" }}>
              Service Type
              <select value={orderType} onChange={(e) => setOrderType(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid #d1d5db", borderRadius: 8, marginTop: 6 }}>
                <option value="Dine-In">Dine-In</option>
                <option value="Room Service">Room Service</option>
              </select>
            </label>

            {orderType === "Room Service" && (
              <label style={{ display: "block" }}>
                Room Number
                <select value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid #d1d5db", borderRadius: 8, marginTop: 6 }}>
                  <option value="">Select Room</option>
                  {Array.from({ length: 150 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>Room {num}</option>
                  ))}
                </select>
              </label>
            )}

            <label style={{ display: "block" }}>
              Notes / Message
              <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Add a note for kitchen, service, or delivery" style={{ width: "100%", padding: 10, border: "1px solid #d1d5db", borderRadius: 8, marginTop: 6, minHeight: 80 }} />
            </label>
          </div>

          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 8, border: "1px solid #d1d5db", borderRadius: 8 }}>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="GCash">GCash</option>
          </select>

          {paymentMethod === "Card" && (
            <div style={{ marginBottom: 12, padding: 12, background: "#eef2ff", borderRadius: 12, border: "1px solid #c7d2fe", color: "#3730a3" }}>
              Card reader ready. Please swipe, insert, or tap the guest card.
            </div>
          )}

          {orderError && <p style={{ color: "#dc2626", marginBottom: 8 }}>{orderError}</p>}

          <button className="button" onClick={checkout} disabled={cart.length === 0 || loading} style={{ width: "100%", background: "#059669" }}>
            {loading ? "Processing..." : "Checkout & Print Receipt"}
          </button>
        </div>

        <button className="button" onClick={() => setShowOrderHistory(!showOrderHistory)} style={{ width: "100%", background: "#6b7280", marginTop: 8 }}>
          Order History ({orders.length})
        </button>

        {showOrderHistory && (
          <div style={{ marginTop: 12, maxHeight: 300, overflowY: "auto", borderTop: "1px solid #d1d5db", paddingTop: 12 }}>
            {orders.slice(0, 10).map(order => (
              <div key={order._id} style={{ padding: 8, marginBottom: 8, background: "white", borderRadius: 6, border: "1px solid #d1d5db", fontSize: "0.85rem" }}>
                <div style={{ fontWeight: "bold" }}>{order.orderId}</div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ color: "#6b7280" }}>${order.totalAmount.toFixed(2)}</span>
                  <span>{order.orderType || "Dine-In"}</span>
                  {order.deliveryRoom && <span>Room {order.deliveryRoom}</span>}
                </div>
                <div style={{ fontSize: "0.75rem", color: order.status === "completed" ? "#059669" : "#dc2626" }}>Status: {order.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem("token") || "";
    return stored.replace(/^Bearer\s+/i, "");
  });
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [currentUser, setCurrentUser] = useState(localStorage.getItem("currentUser") || "");
  const [error, setError] = useState("");
  const [clockStatus, setClockStatus] = useState(localStorage.getItem("clockStatus") || "out");
  const [clockName, setClockName] = useState(localStorage.getItem("clockName") || "");
  const [clockRole, setClockRole] = useState(localStorage.getItem("clockRole") || "frontdesk");
  const [clockLogs, setClockLogs] = useState(JSON.parse(localStorage.getItem("clockLogs") || "[]"));
  const [clockNotice, setClockNotice] = useState("");
  const [showMessagePopup, setShowMessagePopup] = useState(false);

  useEffect(() => {
    localStorage.setItem("clockLogs", JSON.stringify(clockLogs));
  }, [clockLogs]);

  useEffect(() => {
    localStorage.setItem("clockName", clockName);
  }, [clockName]);

  useEffect(() => {
    localStorage.setItem("clockRole", clockRole);
  }, [clockRole]);

  const saveClockLog = (entry) => {
    setClockLogs((prev) => [entry, ...prev].slice(0, 10));
  };

  const recordEvent = async (eventBody) => {
    try {
      await fetch(`${API}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventBody),
      });
    } catch (err) {
      console.warn("Attendance record failed", err);
    }
  };

  const onLogin = async (username, password) => {
    setError("");
    try {
      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Login failed");
      }

      const data = await response.json();
      const rawToken = data.token.replace(/^Bearer\s+/i, "");
      localStorage.setItem("token", rawToken);
      localStorage.setItem("role", data.role);
      localStorage.setItem("currentUser", username);
      setToken(rawToken);
      setRole(data.role);
      setCurrentUser(username);
      recordEvent({ name: username, role: data.role, event: "Login" });
    } catch (err) {
      setError(err.message);
    }
  };

  const onLogout = async () => {
    await fetch(`${API}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({}),
    }).catch(() => null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("currentUser");
    setToken("");
    setRole(null);
    setCurrentUser("");
  };

  const onClockAction = async (eventName) => {
    setError("");
    if (!clockName.trim()) {
      setError("Please enter your name to clock in or out");
      return;
    }

    const timestamp = new Date().toISOString();
    const entry = { name: clockName, role: clockRole, event: eventName, timestamp };
    saveClockLog(entry);
    localStorage.setItem("clockStatus", eventName === "Clock In" ? "in" : "out");
    setClockStatus(eventName === "Clock In" ? "in" : "out");
    setClockNotice(`${eventName} recorded at ${new Date(timestamp).toLocaleTimeString()}`);
    await recordEvent({ name: clockName, role: clockRole, event: eventName });
  };

  const onClockIn = () => onClockAction("Clock In");
  const onClockOut = () => onClockAction("Clock Out");

  if (!role) {
    return (
      <FrontPage
        onLogin={onLogin}
        error={error}
        clockStatus={clockStatus}
        clockName={clockName}
        setClockName={setClockName}
        clockRole={clockRole}
        setClockRole={setClockRole}
        onClockIn={onClockIn}
        onClockOut={onClockOut}
        clockLogs={clockLogs}
        clockNotice={clockNotice}
      />
    );
  }

  return (
    <div className="container">
      <Header role={role} user={currentUser} onLogout={onLogout} />
      {role && role.toLowerCase() === "admin" && <AdminDashboard token={token} onOpenMessages={() => setShowMessagePopup(true)} />}
      {role && role.toLowerCase() === "frontdesk" && <ReservationPage token={token} onOpenMessages={() => setShowMessagePopup(true)} />}
      {role && role.toLowerCase() === "kitchen" && <Kitchen token={token} onOpenMessages={() => setShowMessagePopup(true)} />}
      {role && role.toLowerCase() === "housekeeping" && <Housekeeping token={token} onOpenMessages={() => setShowMessagePopup(true)} />}
      {role && showMessagePopup && <MessageSidebar token={token} role={role} onClose={() => setShowMessagePopup(false)} />}
    </div>
  );
}

// Render the app
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("root");
    if (root) {
      try {
        ReactDOM.createRoot(root).render(React.createElement(App));
      } catch (e) {
        console.error("Render error:", e);
        root.innerHTML = "<p style='color:red; margin: 20px;'>Error loading app.</p>";
      }
    }
  });
} else {
  const root = document.getElementById("root");
  if (root) {
    try {
      ReactDOM.createRoot(root).render(React.createElement(App));
    } catch (e) {
      console.error("Render error:", e);
      root.innerHTML = "<p style='color:red; margin: 20px;'>Error loading app.</p>";
    }
  }
}
