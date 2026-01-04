const admin = require("firebase-admin");

// 1. Ricostruisci la Base64
const base64Key =
  process.env.FIREBASE_PRIVATE_KEY_B64_PART1 +
  process.env.FIREBASE_PRIVATE_KEY_B64_PART2;

// 2. Decodifica Base64 → PEM
const privateKey = Buffer.from(base64Key, "base64").toString("utf8");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    })
  });
}

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
