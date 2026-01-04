const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

exports.handler = async () => {
  const ref = db.collection("items").doc("lampada_1");
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
      id: "lampada_1",
      stato_precedente: stato,
      stato_attuale: stato === "disponibile" ? "occupato" : stato
    })
  };
};
