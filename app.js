const $ = (sel) => document.querySelector(sel);

const btnLoadMore = $("#btnLoadMore");
const status = $("#loadMoreStatus");
const errorBox = $("#loadMoreError");
const grid = $("#itemsGrid");

const modalBackdrop = $("#modalBackdrop");
const btnCloseModal = $("#btnCloseModal");
const modalTitle = $("#modalTitle");
const modalSubtitle = $("#modalSubtitle");
const modalLoading = $("#modalLoading");
const modalError = $("#modalError");
const modalContent = $("#modalContent");
const modalDescription = $("#modalDescription");
const modalRaw = $("#modalRaw");

let page = 1;
let isLoading = false;
let done = false;

// ---- LOAD MORE ----
function setLoadMoreState({ loading, text, error }) {
  isLoading = !!loading;
  btnLoadMore.disabled = isLoading || done;

  if (loading) {
    status.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${text ?? "Loading..."}`;
  } else {
    status.textContent = text ?? "";
  }

  if (error) {
    errorBox.textContent = error;
    errorBox.style.display = "block";
  } else {
    errorBox.style.display = "none";
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderItemCard(item) {
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `
    <div class="item-title">${escapeHtml(item.title)}</div>
    <div class="item-meta">${escapeHtml(item.tag)} • ID ${escapeHtml(item.id)}</div>
    <div class="muted" style="margin-bottom:10px;">${escapeHtml(item.summary)}</div>
    <button class="btn-ghost" data-view-id="${escapeHtml(item.id)}">View details</button>
  `;
  el.querySelector("button[data-view-id]").addEventListener("click", () => {
    openDetailsModal(item.id);
  });
  return el;
}

async function loadMore() {
  if (isLoading || done) return;

  setLoadMoreState({ loading: true, text: `Fetching page ${page}...`, error: null });

  try {
    const url = `./data/items-page-${page}.json`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Request failed (${res.status})`);
    }

    const data = await res.json();

    if (!Array.isArray(data.items) || data.items.length === 0) {
      done = true;
      setLoadMoreState({ loading: false, text: "No more items.", error: null });
      return;
    }

    // Append new cards
    const fragment = document.createDocumentFragment();
    data.items.forEach((item) => fragment.appendChild(renderItemCard(item)));
    grid.appendChild(fragment);

    page += 1;
    setLoadMoreState({
      loading: false,
      text: data.nextPageHint ? data.nextPageHint : `Loaded page ${page - 1}.`,
      error: null
    });
  } catch (e) {
    setLoadMoreState({ loading: false, text: "", error: `Could not load more. ${e.message}` });
  }
}

btnLoadMore.addEventListener("click", loadMore);

// ---- MODAL DETAILS ----
function setModalState({ loading, error, title, subtitle }) {
  if (title !== undefined) modalTitle.textContent = title;
  if (subtitle !== undefined) modalSubtitle.textContent = subtitle;

  modalLoading.style.display = loading ? "block" : "none";
  modalError.style.display = error ? "block" : "none";
  modalError.textContent = error ?? "";

  modalContent.style.display = error || loading ? "none" : "block";
}

async function openDetailsModal(id) {
  // show modal immediately with loading UI
  modalBackdrop.style.display = "flex";
  setModalState({ loading: true, error: null, title: `Item #${id}`, subtitle: "Loading..." });

  try {
    const url = `./data/details-${id}.json`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Request failed (${res.status})`);
    }

    const data = await res.json();

    const pretty = JSON.stringify(data, null, 2);
    modalDescription.textContent = data.description ?? "No description provided.";
    modalRaw.textContent = pretty;

    setModalState({
      loading: false,
      error: null,
      title: data.title ?? `Item #${id}`,
      subtitle: data.tag ? `${data.tag} • ID ${data.id}` : `ID ${data.id}`
    });
  } catch (e) {
    setModalState({ loading: false, error: `Could not load details. ${e.message}` });
  }
}

function closeModal() {
  modalBackdrop.style.display = "none";
}

btnCloseModal.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalBackdrop.style.display === "flex") closeModal();
});

// initial load
loadMore();
