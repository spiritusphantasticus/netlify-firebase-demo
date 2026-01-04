const admin = require("firebase-admin");

// === RICOSTRUZIONE CHIAVE ===
const base64Key =
  (process.env.FIREBASE_PRIVATE_KEY_B64_PART1 || "") +
  (process.env.FIREBASE_PRIVATE_KEY_B64_PART2 || "");

// Decodifica Base64 → UTF8
let decodedKey = Buffer.from(base64Key, "base64").toString("utf8");

// FIX PEM: ricostruire ritorni a capo corretti
decodedKey = decodedKey
  .replace(/\\n/g, "\n") // eventuali \n letterali
  .replace(/-----BEGIN PRIVATE KEY-----/, "-----BEGIN PRIVATE KEY-----\n")
  .replace(/-----END PRIVATE KEY-----/, "\n-----END PRIVATE KEY-----");

// DEBUG SICURO (opzionale, rimuovere in produzione)
console.log("BEGIN:", decodedKey.includes("BEGIN PRIVATE KEY"));
console.log("END:", decodedKey.includes("END PRIVATE KEY"));
console.log("Newlines:", (decodedKey.match(/\n/g) || []).length);

// === INIZIALIZZA FIREBASE ADMIN ===
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: decodedKey,
    }),
  });
}

const db = admin.firestore();

// === FUNCTION ===
exports.handler = async () => {
  try {
    const docRef = db.collection("items").doc("lampada_1");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { statusCode: 404, body: JSON.stringify({ errore: "Oggetto non trovato" }) };
    }

    const statoPrecedente = docSnap.data().status;

    // Se disponibile, passa a occupato
    let statoAttuale = statoPrecedente;
    if (statoPrecedente === "disponibile") {
      await docRef.update({ status: "occupato" });
      statoAttuale = "occupato";
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: "lampada_1",
        stato_precedente: statoPrecedente,
        stato_attuale: statoAttuale,
      }),
    };
  } catch (err) {
    console.error("Errore:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ errore: "Errore interno", details: err.message }),
    };
  }
};

const db = admin.firestore();

exports.handler = async () => {
  const ref = db.collection("items").doc("oggetto_vendita");
  const snap = await ref.get();

  if (!snap.exists) {
    return {
      statusCode: 404,
      body: JSON.stringify({ errore: "Oggetto non trovato" })
    };
  }

  const stato = snap.data().status;

  if (stato === "disponibile") {
    await ref.update({ status: "occupato" });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      id: "oggetto_vendita",
      stato_precedente: stato,
      stato_attuale: stato === "disponibile" ? "occupato" : stato
    })
  };
};
