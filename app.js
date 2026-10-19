const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const toast = (message) => {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => node.classList.remove("show"), 3000);
};
const readStore = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
};
const writeStore = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { toast("Browser storage is unavailable. Your change could not be saved."); return false; }
};

$("#year").textContent = new Date().getFullYear();

// Mobile navigation
$("#menuToggle").addEventListener("click", () => {
  const nav = $("#mainNav");
  const open = nav.classList.toggle("open");
  $("#menuToggle").setAttribute("aria-expanded", String(open));
});
$$('#mainNav a').forEach(link => link.addEventListener("click", () => {
  $("#mainNav").classList.remove("open");
  $("#menuToggle").setAttribute("aria-expanded", "false");
}));

// Library search and filters
let activeFilter = "all";
function filterBooks() {
  const query = $("#bookSearch").value.trim().toLowerCase();
  $$(".book-card").forEach(card => {
    const matchesFilter = activeFilter === "all" || card.dataset.access === activeFilter;
    const matchesSearch = (card.dataset.search + " " + card.innerText).toLowerCase().includes(query);
    card.hidden = !(matchesFilter && matchesSearch);
  });
}
$("#bookSearch").addEventListener("input", filterBooks);
$$(".filter-pill").forEach(button => button.addEventListener("click", () => {
  activeFilter = button.dataset.filter;
  $$(".filter-pill").forEach(item => item.classList.toggle("active", item === button));
  filterBooks();
}));

// Book detail / simulated payment request (no live payment integration yet)
const bookDialog = $("#bookDialog");
$$(".book-action").forEach(button => button.addEventListener("click", () => {
  const isVip = button.dataset.access === "vip";
  $("#dialogBookTitle").textContent = button.dataset.book;
  $("#dialogBookText").textContent = isVip
    ? "This is a premium resource. In the live version, you will be able to pay securely with M-Pesa and access the PDF after payment is confirmed."
    : "This resource is marked as free in this frontend preview. Your own PDF can be connected here when the backend is ready.";
  $("#dialogPrice").textContent = isVip ? (button.dataset.book === "Endgame Essentials" ? "KSh 100" : "KSh 150") : "Free resource";
  $("#paymentDemoForm").hidden = !isVip;
  $("#dialogDemoMessage").textContent = isVip
    ? "Demo only: this form does not send a real M-Pesa prompt or unlock a PDF."
    : "Demo preview: the real PDF viewer will be connected later.";
  bookDialog.showModal();
}));
$$("[data-close]").forEach(button => button.addEventListener("click", () => {
  const dialog = document.getElementById(button.dataset.close);
  if (dialog?.open) dialog.close();
}));
[bookDialog, $("#reviewDialog")].forEach(dialog => dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
}));
$("#paymentDemoForm").addEventListener("submit", event => {
  event.preventDefault();
  toast("Demo only — M-Pesa payments are not connected yet.");
  bookDialog.close();
});

// Personal notes (saved to localStorage on this device/browser)
function renderNotes() {
  const notes = readStore("chessirNotes");
  const container = $("#savedNotes");
  container.replaceChildren();
  if (!notes.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Your saved notes will appear here.";
    container.append(empty);
    return;
  }
  notes.slice().reverse().forEach(note => {
    const article = document.createElement("article");
    article.className = "saved-note";
    const top = document.createElement("div"); top.className = "saved-note-top";
    const heading = document.createElement("div");
    const title = document.createElement("h3"); title.textContent = note.title;
    const category = document.createElement("small"); category.textContent = note.category.toUpperCase();
    heading.append(title, category);
    const del = document.createElement("button"); del.className = "delete-note"; del.type = "button"; del.textContent = "Delete"; del.setAttribute("aria-label", `Delete ${note.title}`);
    del.addEventListener("click", () => {
      const updated = readStore("chessirNotes").filter(item => item.id !== note.id);
      if (writeStore("chessirNotes", updated)) { renderNotes(); toast("Note deleted."); }
    });
    top.append(heading, del);
    const body = document.createElement("p"); body.textContent = note.body;
    const date = document.createElement("small"); date.textContent = new Date(note.createdAt).toLocaleDateString();
    article.append(top, body, date);
    container.append(article);
  });
}
$("#noteForm").addEventListener("submit", event => {
  event.preventDefault();
  const notes = readStore("chessirNotes");
  notes.push({
    id: (window.crypto?.randomUUID?.() || String(Date.now())),
    title: $("#noteTitle").value.trim(),
    category: $("#noteCategory").value,
    body: $("#noteBody").value.trim(),
    createdAt: new Date().toISOString()
  });
  if (writeStore("chessirNotes", notes)) {
    event.target.reset();
    renderNotes();
    toast("Your chess note has been saved on this device.");
  }
});
renderNotes();

// Ask for a book — local demo storage, ready to connect to a form service/backend later
$("#bookRequestForm").addEventListener("submit", event => {
  event.preventDefault();
  const requests = readStore("chessirBookRequests");
  requests.push({
    id: (window.crypto?.randomUUID?.() || String(Date.now())),
    name: $("#requestName").value.trim(),
    title: $("#requestTitle").value.trim(),
    reason: $("#requestReason").value.trim(),
    createdAt: new Date().toISOString()
  });
  if (writeStore("chessirBookRequests", requests)) {
    event.target.reset();
    $("#requestSuccess").hidden = false;
    toast("Book request saved in this browser.");
  }
});

// Review journal modal
$("#openReview").addEventListener("click", () => $("#reviewDialog").showModal());
$("#reviewForm").addEventListener("submit", event => {
  event.preventDefault();
  const reviews = readStore("chessirReviews");
  reviews.push({
    id: (window.crypto?.randomUUID?.() || String(Date.now())),
    title: $("#gameTitle").value.trim(),
    moves: $("#gameMoves").value.trim(),
    lesson: $("#gameLesson").value.trim(),
    createdAt: new Date().toISOString()
  });
  if (writeStore("chessirReviews", reviews)) {
    event.target.reset();
    $("#reviewDialog").close();
    toast("Review saved in this browser.");
  }
});
