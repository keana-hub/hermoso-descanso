import { fetchApi, API, authHeaders, kitchenMenu, App } from "./app";

export function ReservationPage({ token }) {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationType, setReservationType] = useState("Room");
  const [selectedRoomDetails, setSelectedRoomDetails] = useState(null);
  const [newReservation, setNewReservation] = useState({
    guestName: "",
    email: "",
    contact: "",
    roomId: "",
    checkIn: "",
    checkOut: "",
    paymentMethod: "",
    tableNumber: 1,
    reservationTime: "",
  });
  const [dineInReservations, setDineInReservations] = useState([]);

  useEffect(() => {
    loadData();
    // Auto check-out expired reservations
    const interval = setInterval(autoCheckOut, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, roomsData, dineInData] = await Promise.all([
        fetchApi("/bookings", token),
        fetchApi("/rooms", token),
        fetchApi("/dinein", token),
      ]);
      setBookings(bookingsData);
      setRooms(roomsData);
      setDineInReservations(dineInData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const autoCheckOut = async () => {
    const now = new Date();
    const expiredBookings = bookings.filter(booking => new Date(booking.checkOut) < now && booking.status !== "checked_out"
    );

    for (const booking of expiredBookings) {
      try {
        await fetch(`${API}/bookings/${booking._id}/checkout`, {
          method: "POST",
          headers: authHeaders(token),
        });
        // Update local state
        setBookings(prev => prev.map(b => b._id === booking._id ? { ...b, status: "checked_out" } : b
        ));
        // Update room status
        setRooms(prev => prev.map(room => room.number.toString() === booking.roomId ? { ...room, status: "Available", housekeepingStatus: "Pending" } : room
        ));
      } catch (err) {
        console.error("Auto checkout failed:", err);
      }
    }
  };

  const allRoomNumbers = Array.from({ length: 150 }, (_, i) => i + 1);

  const contactHousekeeping = async (room) => {
    const message = prompt(`Send a quick note to Housekeeping for Room ${room.number}:`);
    if (!message) return;

    try {
      await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({
          toRole: "housekeeping",
          message,
          regarding: `Room ${room.number}`,
          roomId: room.number,
        }),
      });
      alert("Message sent to Housekeeping");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReservationSubmit = async (event) => {
    event.preventDefault();
    try {
      const url = reservationType === "Dine-In" ? `${API}/dinein` : `${API}/bookings`;
      const body = reservationType === "Dine-In"
        ? {
          guestName: newReservation.guestName,
          contact: newReservation.contact,
          tableNumber: newReservation.tableNumber,
          orderType: "Dine-In",
          reservationTime: newReservation.reservationTime,
        }
        : newReservation;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to create reservation");
      }

      setNewReservation({ guestName: "", email: "", contact: "", roomId: "", checkIn: "", checkOut: "", paymentMethod: "", tableNumber: 1, reservationTime: "" });
      setReservationType("Room");
      setShowReservationForm(false);
      loadData(); // Refresh data
    } catch (err) {
      setError(err.message);
    }
  };

  const getRoomStatus = (roomNumber) => {
    const roomStr = roomNumber.toString();
    const booking = bookings.find(b => b.roomId === roomStr && b.status === "active");
    if (booking) {
      const now = new Date();
      const checkOut = new Date(booking.checkOut);
      if (checkOut < now) return "Needs Check-out";
      return "Occupied";
    }
    return "Available";
  };

  const getRoomBooking = (roomNumber) => {
    const roomStr = roomNumber.toString();
    return bookings.find(b => b.roomId === roomStr && b.status === "active");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2>Reservation Management</h2>
        <button className="button" onClick={() => setShowReservationForm(true)}>
          New Reservation
        </button>
      </div>

      {error && <p style={{ color: "#dc2626", marginBottom: 16 }}>{error}</p>}

      {showReservationForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
          <div className="card" style={{ width: "min(420px, 100%)", height: "100%", overflowY: "auto", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3>Create New Reservation</h3>
              <button className="button" onClick={() => setShowReservationForm(false)} style={{ background: "#6b7280" }}>
                Close
              </button>
            </div>
            <form onSubmit={handleReservationSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <label>
                  Reservation Type
                  <select
                    value={reservationType}
                    onChange={(e) => setReservationType(e.target.value)}
                  >
                    <option value="Room">Room Reservation</option>
                    <option value="Dine-In">Dine-In Reservation</option>
                  </select>
                </label>
                <label>
                  Guest Name
                  <input
                    value={newReservation.guestName}
                    onChange={(e) => setNewReservation(prev => ({ ...prev, guestName: e.target.value }))}
                    required />
                </label>
                <label>
                  Contact
                  <input
                    value={newReservation.contact}
                    onChange={(e) => setNewReservation(prev => ({ ...prev, contact: e.target.value }))}
                    required />
                </label>
                {reservationType === "Room" && (
                  <>
                    <label>
                      Email
                      <input
                        type="email"
                        value={newReservation.email}
                        onChange={(e) => setNewReservation(prev => ({ ...prev, email: e.target.value }))}
                        required={reservationType === "Room"} />
                    </label>
                    <label>
                      Room Number
                      <select
                        value={newReservation.roomId}
                        onChange={(e) => setNewReservation(prev => ({ ...prev, roomId: e.target.value }))}
                        required
                      >
                        <option value="">Select Room</option>
                        {allRoomNumbers.map((roomNumber) => {
                          const room = rooms.find((r) => r.number === roomNumber);
                          const status = room ? getRoomStatus(room.number) : "Available";
                          return (
                            <option key={roomNumber} value={roomNumber} disabled={status !== "Available"}>
                              {roomNumber} {status !== "Available" ? `- ${status}` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                    <label>
                      Check-In Date
                      <input
                        type="date"
                        value={newReservation.checkIn}
                        onChange={(e) => setNewReservation(prev => ({ ...prev, checkIn: e.target.value }))}
                        required />
                    </label>
                    <label>
                      Check-Out Date
                      <input
                        type="date"
                        value={newReservation.checkOut}
                        onChange={(e) => setNewReservation(prev => ({ ...prev, checkOut: e.target.value }))}
                        required />
                    </label>
                    <label>
                      Payment Method
                      <select
                        value={newReservation.paymentMethod}
                        onChange={(e) => setNewReservation(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        required
                      >
                        <option value="">Select Payment</option>
                        <option value="GCash">GCash</option>
                        <option value="PayPal">PayPal</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </label>
                  </>
                )}
                {reservationType === "Dine-In" && (
                  <>
                    <label>
                      Table Number
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={newReservation.tableNumber}
                        onChange={(e) => setNewReservation(prev => ({ ...prev, tableNumber: parseInt(e.target.value, 10) }))}
                        required />
                    </label>
                    <label>
                      Reservation Time
                      <input
                        type="datetime-local"
                        value={newReservation.reservationTime}
                        onChange={(e) => setNewReservation(prev => ({ ...prev, reservationTime: e.target.value }))}
                        required />
                    </label>
                  </>
                )}
              </div>
              <div style={{ marginTop: 16 }}>
                <button className="button" type="submit">Create Reservation</button>
                <button
                  type="button"
                  onClick={() => setShowReservationForm(false)}
                  style={{ marginLeft: 8, background: "#6b7280" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
      )}

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 24 }}>
            {loading ? (
              <div className="card">Loading rooms...</div>
            ) : (
              rooms.map((room) => {
                const status = getRoomStatus(room.number);
                const booking = getRoomBooking(room.number);
                return (
                  <div key={room._id} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4>Room {room.number}</h4>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        background: status === "Available" ? "#d1fae5" : status === "Occupied" ? "#fee2e2" : "#fef3c7",
                        color: status === "Available" ? "#065f46" : status === "Occupied" ? "#991b1b" : "#92400e"
                      }}>
                        {status}
                      </span>
                    </div>
                    {booking && (
                      <div style={{ marginTop: 8 }}>
                        <p><strong>Guest:</strong> {booking.guestName}</p>
                        <p><strong>Email:</strong> {booking.email}</p>
                        <p><strong>Contact:</strong> {booking.contact}</p>
                        <p><strong>Check-out:</strong> {new Date(booking.checkOut).toLocaleDateString()}</p>
                        <button className="button" onClick={() => {
                          const message = prompt("Enter message to send to room:");
                          if (message) {
                            fetch(`${API}/rooms/${room._id}/contact`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json", ...authHeaders(token) },
                              body: JSON.stringify({ message }),
                            }).then(() => alert("Message sent"));
                          }
                        }} style={{ marginTop: 8, background: "#10b981" }}>Contact Room</button>
                        <button className="button" onClick={() => contactHousekeeping(room)} style={{ marginTop: 8, marginLeft: 8, background: "#3b82f6" }}>
                          Contact Housekeeping
                        </button>
                      </div>
                    )}
                    <p><strong>Housekeeping:</strong> {room.housekeepingStatus}</p>
                    <button className="button" onClick={() => {
                      const newStatus = room.housekeepingStatus === "Clean" ? "Needs Cleaning" : "Clean";
                      fetch(`${API}/rooms/${room._id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json", ...authHeaders(token) },
                        body: JSON.stringify({ housekeepingStatus: newStatus }),
                      }).then(() => loadData());
                    }} style={{ marginTop: 8, background: room.housekeepingStatus === "Clean" ? "#f59e0b" : "#059669" }}>
                      {room.housekeepingStatus === "Clean" ? "Mark Needs Cleaning" : "Mark Clean"}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="card">
            <h3>Current Reservations</h3>
            {loading ? (
              <p>Loading reservations...</p>
            ) : bookings.length === 0 ? (
              <p>No active reservations</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Room</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>{booking.guestName}</td>
                      <td>{booking.email}</td>
                      <td>{booking.contact}</td>
                      <td>{booking.roomId}</td>
                      <td>{new Date(booking.checkIn).toLocaleDateString()}</td>
                      <td>{new Date(booking.checkOut).toLocaleDateString()}</td>
                      <td>{booking.paymentMethod}</td>
                      <td>{booking.status || "active"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <h3>Dine-In Reservations</h3>
            {loading ? (
              <p>Loading dine-in reservations...</p>
            ) : dineInReservations.length === 0 ? (
              <p>No dine-in reservations yet</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Table</th>
                    <th>Room</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dineInReservations.map((reservation) => (
                    <tr key={reservation._id}>
                      <td>{reservation.guestName}</td>
                      <td>{reservation.contact}</td>
                      <td>{reservation.orderType}</td>
                      <td>{reservation.tableNumber || "-"}</td>
                      <td>{reservation.deliveryRoom || "-"}</td>
                      <td>{new Date(reservation.reservationTime).toLocaleString()}</td>
                      <td>{reservation.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )};
}

      function Kitchen({token}) { }
      const [items, setItems] = useState([]);
      const [equipment, setEquipment] = useState([]);
      const [stock, setStock] = useState([]);
      const [lowStock, setLowStock] = useState([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState("");
      const [posItems, setPosItems] = useState([]);
      const [receipt, setReceipt] = useState(null);
      const [orderType, setOrderType] = useState("Dine-In");
      const [tableNumber, setTableNumber] = useState(1);
      const [deliveryRoom, setDeliveryRoom] = useState("");
      const [dineInReservations, setDineInReservations] = useState([]);
      const [contactModal, setContactModal] = useState({show}: false, toRole: "", message: "" });
      const [kitchenTools, setKitchenTools] = useState([]);
      const [kitchenIngredients, setKitchenIngredients] = useState([]);
      const [selectedKitchenCategory, setSelectedKitchenCategory] = useState("All");
      const [selectedKitchenItem, setSelectedKitchenItem] = useState(null);

  useEffect(() => {loadData()};
      loadDineInReservations();
  }, [token]);

  const loadData = async () => {setLoading(true)};
      try { }
      const [inventoryData, equipmentData, stockData] = await Promise.all([
      fetchApi("/inventory/kitchen", token),
      fetchApi("/equipment", token),
      fetchApi("/stock", token),
      ]);
      setKitchenTools(inventoryData.tools || []);
      setKitchenIngredients(inventoryData.ingredients || []);
      setItems([...(inventoryData.tools || []), ...(inventoryData.ingredients || [])]);
      setEquipment(equipmentData);
      setStock(stockData.stock);
      setLowStock(stockData.lowStock);
    } catch (err) {setError(err.message)};
    } finally {setLoading(false)};
    }
  };

  const loadDineInReservations = async () => { }
      try { }
      const reservations = await fetchApi("/dinein", token);
      setDineInReservations(reservations);
    } catch (err) {console.warn("Unable to load dine-in reservations", err)};
    }
  };

  const filteredKitchenItems = () => { }
      if (selectedKitchenCategory === "Tools") return kitchenTools;
      if (selectedKitchenCategory === "Ingredients") return kitchenIngredients;
      return [...kitchenTools, ...kitchenIngredients];
  };

  const handleKitchenInventoryClick = (item) => {setSelectedKitchenItem(item)};
  };

  const selectKitchenCategory = (category) => {setSelectedKitchenCategory(category)};
      setSelectedKitchenItem(null);
  };

  const updateEquipment = async (id, quantity) => { }
      try {await fetch(`${API}/equipment/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ quantity }),
      })};
      loadData();
    } catch (err) {setError(err.message)};
    }
  };

  const updateStock = async (id, quantity) => { }
      try {await fetch(`${API}/stock/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ quantity }),
      })};
      loadData();
    } catch (err) {setError(err.message)};
    }
  };

  const addToPos = (item) => {setPosItems(prev => [...prev, item])};
  };

  const generateReceipt = async () => { }
      if (posItems.length === 0) return;
      try { }
      const total = posItems.reduce((sum, item) => sum + item.price, 0);
      const receiptData = await fetch(`${API}/pos/receipt`, {method}: "POST",
      headers: {"Content-Type"}: "application/json", ...authHeaders(token) },
      body: JSON.stringify({items}: posItems,
      total,
      orderType,
      tableNumber: orderType === "Dine-In" ? tableNumber : undefined,
      deliveryRoom: orderType === "Delivery" ? deliveryRoom : undefined,
        }),
      }).then(async (res) => { }
      if (!res.ok) { }
      const text = await res.text();
      throw new Error(text || "Failed to generate receipt");
        }
      return res.json();
      });
      setReceipt(receiptData);
      setPosItems([]);
    } catch (err) {setError(err.message)};
    }
  };

  const printReceipt = () => { }
      if (!receipt) return;
      const printWindow = window.open("", "PrintReceipt", "width=700,height=900");
      if (!printWindow) return;

      const html = `
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body {font - family}: Arial, sans-serif; padding: 20px; }
            h1, h2, h3, h4 {margin}: 8px 0; }
            table {width}: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td {text - align}: left; padding: 8px; border-bottom: 1px solid #ccc; }
            .total {font - weight}: bold; font-size: 1.1rem; margin-top: 16px; }
          </style>
        </head>
        <body>
          <h1>${receipt.hotelName}</h1>
          <p>${receipt.address}</p>
          <p>Serial: ${receipt.serialNumber}</p>
          <p>Date: ${new Date(receipt.dateIssued).toLocaleString()}</p>
          <p>Order Type: ${receipt.orderType || "Dine-In"}</p>
          ${receipt.orderType === "Dine-In" ? `<p>Table: ${receipt.tableNumber}</p>` : ""}
          ${receipt.orderType === "Delivery" ? `<p>Room: ${receipt.deliveryRoom}</p>` : ""}
          <table>
            <thead>
              <tr><th>Item</th><th>Price</th></tr>
            </thead>
            <tbody>
              ${receipt.items.map(item => `<tr><td>${item.name}</td><td>${item.price}</td></tr>`).join("")}
            </tbody>
          </table>
          <p class="total">Total: $${receipt.total}</p>
        </body>
      </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
  };

  const menuCategories = [...new Set(kitchenMenu.map(item => item.category))];

      return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
        <div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div className="card">
              <h3>POS System</h3>
              <p>Select menu items from each category, choose Dine-In or Delivery, and generate a printable receipt.</p>
              <label>
                Order Type
                <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                  <option value="Dine-In">Dine-In</option>
                  <option value="Delivery">Delivery</option>
                </select>
              </label>
              {orderType === "Dine-In" && (
                <label>
                  Table Number
                  <input type="number" min={1} max={20} value={tableNumber} onChange={(e) => setTableNumber(parseInt(e.target.value, 10) || 1)} />
                </label>
              )}
              {orderType === "Delivery" && (
                <label>
                  Delivery Room
                  <input value={deliveryRoom} onChange={(e) => setDeliveryRoom(e.target.value)} placeholder="Room number" />
                </label>
              )}
              <div style={{ marginBottom: 16 }}>
                {menuCategories.map((category) => (
                  <div key={category} style={{ marginBottom: 16 }}>
                    <h4>{category}</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {kitchenMenu.filter((item) => item.category === category).map((item) => (
                        <button
                          key={item.name}
                          className="button"
                          style={{ padding: "10px 12px", fontSize: "0.9rem" }}
                          onClick={() => addToPos(item)}
                        >
                          {item.name} (${item.price})
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h4>Cart</h4>
                {posItems.length === 0 ? <p>No items yet.</p> : (
                  <ul style={{ paddingLeft: 16 }}>
                    {posItems.map((item, index) => (
                      <li key={`${item.name}-${index}`}>{item.name} - ${item.price}</li>
                    ))}
                  </ul>
                )}
                <p><strong>Total: ${posItems.reduce((sum, item) => sum + item.price, 0)}</strong></p>
                <button className="button" onClick={generateReceipt} disabled={posItems.length === 0}>
                  Generate Receipt
                </button>
                {receipt && (
                  <button className="button" onClick={printReceipt} style={{ marginLeft: 8, background: "#111827" }}>
                    Print Receipt
                  </button>
                )}
              </div>

              {receipt && (
                <div style={{ marginTop: 16, padding: 16, background: "#f9fafb", borderRadius: 8 }}>
                  <h4>Receipt Preview</h4>
                  <p><strong>Hotel:</strong> {receipt.hotelName}</p>
                  <p><strong>Address:</strong> {receipt.address}</p>
                  <p><strong>Serial:</strong> {receipt.serialNumber}</p>
                  <p><strong>Date:</strong> {new Date(receipt.dateIssued).toLocaleString()}</p>
                  <p><strong>Order Type:</strong> {receipt.orderType}</p>
                  {receipt.orderType === "Dine-In" && <p><strong>Table:</strong> {receipt.tableNumber}</p>}
                  {receipt.orderType === "Delivery" && <p><strong>Room:</strong> {receipt.deliveryRoom}</p>}
                  <ul>
                    {receipt.items.map((item, index) => (
                      <li key={`${item.name}-${index}`}>{item.name} - ${item.price}</li>
                    ))}
                  </ul>
                  <p><strong>Total:</strong> ${receipt.total}</p>
                </div>
              )}
            </div>

            <div className="card">
              <h3>Low Stock Warning</h3>
              {lowStock.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {lowStock.map((item) => (
                    <li key={item._id} style={{ color: "#dc2626", padding: "8px 0" }}>
                      {item.name}: {item.quantity} left
                    </li>
                  ))}
                </ul>
              ) : (
                <p>All stock levels are good.</p>
              )}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3>Kitchen Equipment</h3>
            {loading && <p>Loading equipment...</p>}
            {error && <p style={{ color: "#dc2626" }}>{error}</p>}
            {!loading && !error && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {equipment.map((item) => (
                  <div key={item._id} style={{ border: "1px solid #e5e7eb", padding: 16, borderRadius: 8 }}>
                    <p><strong>{item.name}</strong></p>
                    <p>Quantity: {item.quantity}</p>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateEquipment(item._id, parseInt(e.target.value, 10))}
                      style={{ width: "100%" }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3>Kitchen Stock Ingredients</h3>
            {loading && <p>Loading stock...</p>}
            {error && <p style={{ color: "#dc2626" }}>{error}</p>}
            {!loading && !error && (
              <div>
                {["Frozen", "Chilled", "Room Temperature"].map((category) => (
                  <div key={category} style={{ marginBottom: 24 }}>
                    <h4>{category}</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                      {stock.filter((item) => item.category === category).map((item) => (
                        <div key={item._id} style={{ border: "1px solid #e5e7eb", padding: 16, borderRadius: 8 }}>
                          <p><strong>{item.name}</strong></p>
                          <p>Quantity: {item.quantity}</p>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateStock(item._id, parseInt(e.target.value, 10))}
                            style={{ width: "100%" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3>Dine-In / Delivery Reservations</h3>
            {dineInReservations.length === 0 ? (
              <p>No dine-in reservations yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Table</th>
                    <th>Room</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dineInReservations.map((reservation) => (
                    <tr key={reservation._id}>
                      <td>{reservation.guestName}</td>
                      <td>{reservation.contact}</td>
                      <td>{reservation.orderType}</td>
                      <td>{reservation.tableNumber || "-"}</td>
                      <td>{reservation.deliveryRoom || "-"}</td>
                      <td>{new Date(reservation.reservationTime).toLocaleString()}</td>
                      <td>{reservation.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card" style={{ position: "sticky", top: 24, height: "fit-content" }}>
          <h3>Inventory</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            {["All", "Tools", "Ingredients"].map((category) => (
              <button
                key={category}
                className="button"
                onClick={() => selectKitchenCategory(category)}
                style={{
                  width: "100%",
                  background: selectedKitchenCategory === category ? "#111827" : "#6b7280",
                  fontSize: "0.9rem"
                }}
              >
                {category} {category === "All" ? `(${kitchenTools.length + kitchenIngredients.length})` : category === "Tools" ? `(${kitchenTools.length})` : `(${kitchenIngredients.length})`}
              </button>
            ))}
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div style={{ maxHeight: 300, overflowY: "auto", marginTop: 16 }}>
              {filteredKitchenItems().map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleKitchenInventoryClick(item)}
                  style={{
                    padding: 10,
                    marginBottom: 8,
                    borderRadius: 8,
                    border: selectedKitchenItem && selectedKitchenItem._id === item._id ? "2px solid #111827" : "1px solid #e5e7eb",
                    cursor: "pointer",
                    background: selectedKitchenItem && selectedKitchenItem._id === item._id ? "#f3f4f6" : "white",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{item.name}</span>
                    <strong>{item.quantity}</strong>
                  </div>
                  <div style={{ marginTop: 6, color: "#6b7280", fontSize: "0.85rem" }}>
                    {item.category || "Kitchen Item"}
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedKitchenItem ? (
            <div style={{ marginTop: 16, padding: 16, background: "#f9fafb", borderRadius: 8 }}>
              <h4 style={{ marginTop: 0 }}>{selectedKitchenItem.name}</h4>
              <p style={{ margin: 0 }}><strong>Category:</strong> {selectedKitchenItem.category || "Kitchen"}</p>
              <p style={{ margin: "8px 0 0" }}><strong>Quantity:</strong> {selectedKitchenItem.quantity}</p>
              {selectedKitchenItem.description && <p style={{ marginTop: 8 }}>{selectedKitchenItem.description}</p>}
            </div>
          ) : (
            <p style={{ marginTop: 16, color: "#6b7280" }}>Click any inventory item to view details.</p>
          )}
          <button className="button" onClick={() => setContactModal({ show: true, toRole: "frontdesk", message: "Need to place an order" })} style={{ width: "100%", marginTop: 16 }}>
            Contact FrontDesk
          </button>
        </div>

        {contactModal.show && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div className="card" style={{ maxWidth: 400, width: "90%" }}>
              <h3>Send Message</h3>
              <label>
                Message
                <textarea
                  defaultValue={contactModal.message}
                  onChange={(e) => setContactModal({ ...contactModal, message: e.target.value })}
                  placeholder="Type message..."
                  style={{ width: "100%", height: 100, padding: 12, borderRadius: 8, border: "1px solid #d1d5db", fontFamily: "inherit" }} />
              </label>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button className="button" onClick={() => {
                  fetch(`${API}/contact`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...authHeaders(token) },
                    body: JSON.stringify({
                      toRole: contactModal.toRole,
                      message: contactModal.message,
                      regarding: "Kitchen",
                    }),
                  }).then(() => setContactModal({ show: false, toRole: "", message: "" })).catch(err => setError(err.message));
                }}>Send</button>
                <button className="button" onClick={() => setContactModal({ show: false, toRole: "", message: "" })} style={{ background: "#6b7280" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
      );
}

      function Housekeeping({token}) { }
      const [rooms, setRooms] = useState([]);
      const [items, setItems] = useState([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState("");
      const [contactMessages, setContactMessages] = useState([]);
      const [contactModal, setContactModal] = useState({show}: false, toRole: "", message: "" });
      const [selectedHousekeepingItem, setSelectedHousekeepingItem] = useState(null);
      const [filteredRooms, setFilteredRooms] = useState([]);
      const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {Promise.all([
        fetchApi("/rooms", token),
        fetchApi("/inventory?category=Housekeeping", token),
        fetchApi("/contact/messages", token),
      ])
        .then(([roomsData, inventoryData, messagesData]) => {
          setRooms(roomsData);
          setFilteredRooms(roomsData);
          setItems(inventoryData);
          setContactMessages(messagesData);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))};

    const interval = setInterval(() => {fetchApi("/contact/messages", token).then(msgs => setContactMessages(msgs))};
      fetchApi("/rooms", token).then(roomsData => {setRooms(roomsData)};
      if (filterStatus === "all") setFilteredRooms(roomsData);
        else setFilteredRooms(roomsData.filter(r => r.housekeepingStatus === filterStatus));
      });
    }, 20000);

    return () => clearInterval(interval);
  }, [token]);

  const updateRoomStatus = async (roomId, newStatus) => { }
      try {await fetch(`${API}/rooms/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ housekeepingStatus: newStatus }),
      })};
      const updated = rooms.map(r => r._id === roomId ? {...r, housekeepingStatus}: newStatus } : r);
      setRooms(updated);
      if (filterStatus === "all") setFilteredRooms(updated);
      else setFilteredRooms(updated.filter(r => r.housekeepingStatus === filterStatus));
    } catch (err) {setError(err.message)};
    }
  };

  const markMessageRead = async (id) => { }
      try {await fetch(`${API}/contact/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
      })};
      setContactMessages(prev => prev.map(m => m._id === id ? {...m, read}: true } : m));
    } catch (err) {console.warn("Failed to mark message", err)};
    }
  };

  const handleFilterChange = (status) => {setFilterStatus(status)};
      if (status === "all") {setFilteredRooms(rooms)};
    } else {setFilteredRooms(rooms.filter(r => r.housekeepingStatus === status))};
    }
  };

  const selectHousekeepingItem = (item) => {setSelectedHousekeepingItem(item)};
  };

      return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
        <div>
          <div style={{ marginBottom: 24 }}>
            <h2>Housekeeping Management</h2>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <button className="button" onClick={() => handleFilterChange("all")} style={{ background: filterStatus === "all" ? "#111827" : "#6b7280" }}>
                All Rooms
              </button>
              <button className="button" onClick={() => handleFilterChange("Clean")} style={{ background: filterStatus === "Clean" ? "#10b981" : "#6b7280" }}>
                Clean
              </button>
              <button className="button" onClick={() => handleFilterChange("Pending")} style={{ background: filterStatus === "Pending" ? "#f59e0b" : "#6b7280" }}>
                Pending
              </button>
              <button className="button" onClick={() => handleFilterChange("Needs Cleaning")} style={{ background: filterStatus === "Needs Cleaning" ? "#ef4444" : "#6b7280" }}>
                Needs Cleaning
              </button>
              <button className="button" onClick={() => handleFilterChange("In Progress")} style={{ background: filterStatus === "In Progress" ? "#3b82f6" : "#6b7280" }}>
                In Progress
              </button>
            </div>
          </div>

          {error && <p style={{ color: "#dc2626", marginBottom: 16 }}>{error}</p>}

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
            {loading ? (
              <div className="card">Loading rooms...</div>
            ) : filteredRooms.length === 0 ? (
              <div className="card">No rooms with this status</div>
            ) : (
              filteredRooms.map((room) => (
                <div key={room._id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h4>Room {room.number}</h4>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      background: room.housekeepingStatus === "Clean" ? "#d1fae5" : room.housekeepingStatus === "Pending" ? "#fef3c7" : "#fee2e2",
                      color: room.housekeepingStatus === "Clean" ? "#065f46" : room.housekeepingStatus === "Pending" ? "#92400e" : "#991b1b",
                    }}>
                      {room.housekeepingStatus}
                    </span>
                  </div>
                  <p><strong>Room Status:</strong> {room.status}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                    <button className="button" onClick={() => updateRoomStatus(room._id, "In Progress")} style={{ background: "#3b82f6", fontSize: "0.85rem", padding: "8px 12px" }}>
                      In Progress
                    </button>
                    <button className="button" onClick={() => updateRoomStatus(room._id, "Clean")} style={{ background: "#10b981", fontSize: "0.85rem", padding: "8px 12px" }}>
                      Mark Clean
                    </button>
                  </div>
                  <button className="button" onClick={() => setContactModal({ show: true, toRole: "frontdesk", message: `Question about Room ${room.number}` })} style={{ width: "100%", marginTop: 8, fontSize: "0.85rem", padding: "8px 12px", background: "#06b6d4" }}>
                    Contact FrontDesk
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card" style={{ position: "sticky", top: 24 }}>
            <h3>Inventory</h3>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                  <button className="button" onClick={() => selectHousekeepingItem(null)} style={{ width: "100%", background: "#111827" }}>
                    All Supplies ({items.length})
                  </button>
                  {items.map((item) => (
                    <button
                      key={item._id}
                      className="button"
                      onClick={() => selectHousekeepingItem(item)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        background: selectedHousekeepingItem && selectedHousekeepingItem._id === item._id ? "#f3f4f6" : "#6b7280",
                        color: selectedHousekeepingItem && selectedHousekeepingItem._id === item._id ? "#111827" : "white",
                      }}
                    >
                      <span>{item.name}</span>
                      <span style={{ float: "right", fontWeight: "bold" }}>{item.quantity}</span>
                    </button>
                  ))}
                </div>
                {selectedHousekeepingItem && (
                  <div style={{ marginTop: 16, padding: 16, background: "#f9fafb", borderRadius: 8 }}>
                    <h4 style={{ marginTop: 0 }}>{selectedHousekeepingItem.name}</h4>
                    <p style={{ margin: "8px 0 0" }}><strong>Quantity:</strong> {selectedHousekeepingItem.quantity}</p>
                    {selectedHousekeepingItem.category && <p style={{ margin: "8px 0 0" }}><strong>Category:</strong> {selectedHousekeepingItem.category}</p>}
                    {selectedHousekeepingItem.description && <p style={{ marginTop: 8 }}>{selectedHousekeepingItem.description}</p>}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card">
            <h3>Messages</h3>
            {contactMessages.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No new messages</p>
            ) : (
              <div>
                {contactMessages.map((msg) => (
                  <div key={msg._id} onClick={() => markMessageRead(msg._id)} style={{
                    padding: 10,
                    marginBottom: 8,
                    background: msg.read ? "#f9fafb" : "#fef3c7",
                    borderRadius: 6,
                    cursor: "pointer",
                    borderLeft: `3px solid ${msg.read ? "#d1d5db" : "#f59e0b"}`,
                  }}>
                    <p style={{ margin: "0 0 4px 0", fontSize: "0.85rem", fontWeight: "bold" }}>From {msg.fromRole}</p>
                    <p style={{ margin: "0 0 4px 0", fontSize: "0.8rem" }}>{msg.message}</p>
                    <p style={{ margin: 0, fontSize: "0.7rem", color: "#6b7280" }}>{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {contactModal.show && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div className="card" style={{ maxWidth: 400, width: "90%" }}>
              <h3>Send Message</h3>
              <label>
                Message
                <textarea
                  defaultValue={contactModal.message}
                  onChange={(e) => setContactModal({ ...contactModal, message: e.target.value })}
                  placeholder="Type message..."
                  style={{ width: "100%", height: 100, padding: 12, borderRadius: 8, border: "1px solid #d1d5db", fontFamily: "inherit" }} />
              </label>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button className="button" onClick={() => {
                  fetch(`${API}/contact`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...authHeaders(token) },
                    body: JSON.stringify({
                      toRole: contactModal.toRole,
                      message: contactModal.message,
                      regarding: "Housekeeping",
                    }),
                  }).then(() => {
                    setContactModal({ show: false, toRole: "", message: "" });
                    alert("Message sent!");
                  }).catch(err => setError(err.message));
                }}>Send</button>
                <button className="button" onClick={() => setContactModal({ show: false, toRole: "", message: "" })} style={{ background: "#6b7280" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
      );
}

      // Ensure DOM is ready before rendering
      if (document.readyState === "loading") {document.addEventListener("DOMContentLoaded", () => {
        const root = document.getElementById("root");
        if (root) {
          try {
            ReactDOM.createRoot(root).render(<App />);
            console.log("React app rendered successfully");
          } catch (e) {
            console.error("React render error:", e);
            root.innerHTML = "<p style='color:red; margin: 20px;'>Error loading app. Check browser console for details.</p>";
          }
        } else {
          console.error("Root element not found");
        }
      })};
} else { }
      const root = document.getElementById("root");
      if (root) { }
      try {ReactDOM.createRoot(root).render(<App />)};
      console.log("React app rendered successfully");
    } catch (e) {console.error("React render error:", e)};
      root.innerHTML = "<p style='color:red; margin: 20px;'>Error loading app. Check browser console for details.</p>";
    }
  } else {console.error("Root element not found")};
  }
}
    </>);
}
