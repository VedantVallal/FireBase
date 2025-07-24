const Appwrite = window.Appwrite
const gsap = window.gsap
const ScrollTrigger = window.ScrollTrigger

// Appwrite Configuration - using global Appwrite from CDN
const client = new Appwrite.Client()
client.setEndpoint("https://fra.cloud.appwrite.io/v1").setProject("688095ee001e5d2b2de1")

const storage = new Appwrite.Storage(client)
const statusEl = document.getElementById("status")

// Global variables
const uploadedImages = []
let currentFilter = "all"
let currentModalImageData = null

// GSAP Animations and Preloader
document.addEventListener("DOMContentLoaded", () => {
  initializePreloader()
  initializeAnimations()
  initializeUpload()
  initializeGallery()
  initializeModal()
  loadExistingImages()
})

// Preloader Animation
function initializePreloader() {
  const tl = gsap.timeline()

  // Animate loading progress
  tl.to(".loading-progress", {
    width: "100%",
    duration: 2,
    ease: "power2.inOut",
  })
    .to(
      ".preloader-logo",
      {
        scale: 1.1,
        duration: 0.5,
        ease: "power2.inOut",
      },
      "-=1",
    )
    .to(".preloader-logo", {
      scale: 1,
      duration: 0.5,
      ease: "power2.inOut",
    })
    .to("#preloader", {
      opacity: 0,
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => {
        document.getElementById("preloader").style.display = "none"
        showMainContent()
      },
    })
}

// Show main content with animations
function showMainContent() {
  gsap.set("#main-content", { opacity: 1 })

  const tl = gsap.timeline()

  tl.from(".hero-title", {
    y: 50,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
  })
    .from(
      ".hero-description",
      {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      },
      "-=0.5",
    )
    .from(
      ".cta-button",
      {
        y: 30,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
      },
      "-=0.3",
    )
    .from(
      ".navbar",
      {
        y: -50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      },
      "-=0.8",
    )
}

// Initialize scroll animations
function initializeAnimations() {
  // Register ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger)

  // Smooth scroll for navigation
  document.querySelectorAll(".nav-link, .cta-button").forEach((link) => {
    link.addEventListener("click", function (e) {
      if (this.getAttribute("href").startsWith("#")) {
        e.preventDefault()
        const target = document.querySelector(this.getAttribute("href"))
        if (target) {
          gsap.to(window, {
            duration: 1,
            scrollTo: target,
            ease: "power2.inOut",
          })
        }
      }
    })
  })

  // Animate sections on scroll
  gsap.utils.toArray(".section-title").forEach((title) => {
    gsap.from(title, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: title,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none reverse",
      },
    })
  })
}

// Initialize upload functionality
function initializeUpload() {
  const uploadArea = document.getElementById("uploadArea")
  const fileInput = document.getElementById("fileInput")

  // Drag and drop functionality
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault()
    uploadArea.classList.add("dragover")
  })

  uploadArea.addEventListener("dragleave", (e) => {
    e.preventDefault()
    uploadArea.classList.remove("dragover")
  })

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault()
    uploadArea.classList.remove("dragover")
    const files = e.dataTransfer.files
    handleFiles(files)
  })

  // File input change
  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files)
  })

  // Click to upload
  uploadArea.addEventListener("click", () => {
    fileInput.click()
  })
}

// Handle file uploads
function handleFiles(files) {
  Array.from(files).forEach((file) => {
    if (file.type.startsWith("image/")) {
      uploadImage(file)
    }
  })
}

// Upload image function (your provided code enhanced)
function uploadImage(file) {
  if (!file) {
    showStatus("Please select a file.", "error")
    return
  }

  showStatus("Uploading...", "loading")

  // Animate upload area
  gsap.to("#uploadArea", {
    scale: 0.95,
    duration: 0.2,
    yoyo: true,
    repeat: 1,
    ease: "power2.inOut",
  })

  storage
    .createFile(
      "688096dd0000d42d7c74", // Bucket ID
      "unique()",
      file,
    )
    .then((response) => {
      console.log("File uploaded:", response)
      showStatus("Upload successful! File ID: " + response.$id, "success")

      // Add to uploaded images array
      const imageData = {
        id: response.$id,
        name: file.name,
        uploadDate: new Date().toLocaleDateString(),
        url: getImageUrl(response.$id),
      }

      uploadedImages.unshift(imageData)
      addImageToGrid(imageData)

      // Animate success
      gsap.from(".status.success", {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
      })
    })
    .catch((error) => {
      console.error("Upload failed:", error)
      showStatus("Upload failed: " + error.message, "error")

      // Animate error
      gsap.from(".status.error", {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
      })
    })
}

// Get image URL from Appwrite
function getImageUrl(fileId) {
  return `https://fra.cloud.appwrite.io/v1/storage/buckets/688096dd0000d42d7c74/files/${fileId}/view?project=688095ee001e5d2b2de1`
}

// Show status message
function showStatus(message, type) {
  statusEl.textContent = message
  statusEl.className = `status ${type}`

  // Auto hide success/error messages
  if (type !== "loading") {
    setTimeout(() => {
      gsap.to(statusEl, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          statusEl.textContent = ""
          statusEl.className = "status"
          gsap.set(statusEl, { opacity: 1 })
        },
      })
    }, 3000)
  }
}

// Initialize gallery
function initializeGallery() {
  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"))
      this.classList.add("active")
      currentFilter = this.dataset.filter
      filterImages()
    })
  })

  // Load more button
  document.getElementById("loadMoreBtn").addEventListener("click", loadMoreImages)
}

// Add image to grid with Pinterest-style layout
function addImageToGrid(imageData) {
  const grid = document.getElementById("imageGrid")
  const imageItem = document.createElement("div")
  imageItem.className = "image-item"
  imageItem.dataset.id = imageData.id

  // Random height for Pinterest effect
  const heights = ["200px", "250px", "300px", "350px", "280px", "320px"]
  const randomHeight = heights[Math.floor(Math.random() * heights.length)]

  console.log(imageData.url)

  imageItem.innerHTML = `
        <img src="${imageData.url}" alt="${imageData.name}" style="height: ${randomHeight}; object-fit: cover;">
        <button class="image-delete-btn" onclick="deleteImage('${imageData.id}', event)">×</button>
        <div class="image-info">
            <div class="image-title">${imageData.name}</div>
            <div class="image-date">${imageData.uploadDate}</div>
        </div>
    `

  // Add click event for modal (but not on delete button)
  imageItem.addEventListener("click", (e) => {
    if (!e.target.classList.contains("image-delete-btn")) {
      openModal(imageData)
    }
  })

  // Insert at the beginning for newest first
  grid.insertBefore(imageItem, grid.firstChild)

  // Animate new image
  gsap.from(imageItem, {
    scale: 0.8,
    opacity: 0,
    y: 50,
    duration: 0.6,
    ease: "back.out(1.7)",
  })
}

// Delete image function
function deleteImage(imageId, event) {
  if (event) {
    event.stopPropagation() // Prevent modal from opening
  }

  // Show confirmation
  if (!confirm("Are you sure you want to delete this image?")) {
    return
  }

  showStatus("Deleting image...", "loading")

  // Delete from Appwrite storage
  storage
    .deleteFile("688096dd0000d42d7c74", imageId)
    .then(() => {
      console.log("File deleted from Appwrite:", imageId)

      // Remove from uploadedImages array
      const imageIndex = uploadedImages.findIndex((img) => img.id === imageId)
      if (imageIndex > -1) {
        uploadedImages.splice(imageIndex, 1)
      }

      // Remove from UI with animation
      const imageElement = document.querySelector(`[data-id="${imageId}"]`)
      if (imageElement) {
        gsap.to(imageElement, {
          scale: 0.8,
          opacity: 0,
          y: -50,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => {
            imageElement.remove()
          },
        })
      }

      // Close modal if this image is currently open
      if (currentModalImageData && currentModalImageData.id === imageId) {
        closeModal()
      }

      showStatus("Image deleted successfully!", "success")
    })
    .catch((error) => {
      console.error("Delete failed:", error)
      showStatus("Failed to delete image: " + error.message, "error")
    })
}

// Filter images
function filterImages() {
  const items = document.querySelectorAll(".image-item")

  items.forEach((item) => {
    let show = true

    if (currentFilter === "recent") {
      // Show only images from last 7 days (simplified)
      show = true // In real app, check actual date
    } else if (currentFilter === "popular") {
      // Show popular images (simplified)
      show = true // In real app, check popularity metrics
    }

    if (show) {
      gsap.to(item, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      })
    } else {
      gsap.to(item, {
        opacity: 0.3,
        scale: 0.95,
        duration: 0.3,
        ease: "power2.out",
      })
    }
  })
}

// Initialize modal
function initializeModal() {
  const modal = document.getElementById("imageModal")
  const closeBtn = document.querySelector(".close-modal")
  const deleteBtn = document.getElementById("modalDeleteBtn")

  closeBtn.addEventListener("click", closeModal)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal()
    }
  })

  // Delete button in modal
  deleteBtn.addEventListener("click", () => {
    if (currentModalImageData) {
      deleteImage(currentModalImageData.id)
    }
  })

  // Close on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal()
    }
  })
}

// Open modal
function openModal(imageData) {
  const modal = document.getElementById("imageModal")
  const modalImage = document.getElementById("modalImage")
  const modalTitle = document.getElementById("modalTitle")
  const modalDate = document.getElementById("modalDate")

  currentModalImageData = imageData

  modalImage.src = imageData.url
  modalTitle.textContent = imageData.name
  modalDate.textContent = `Uploaded on ${imageData.uploadDate}`

  modal.style.display = "block"

  // Animate modal
  gsap.from(".modal-content", {
    scale: 0.8,
    opacity: 0,
    duration: 0.3,
    ease: "back.out(1.7)",
  })
}

// Close modal
function closeModal() {
  const modal = document.getElementById("imageModal")
  currentModalImageData = null

  gsap.to(".modal-content", {
    scale: 0.8,
    opacity: 0,
    duration: 0.2,
    ease: "power2.in",
    onComplete: () => {
      modal.style.display = "none"
    },
  })
}

// Load existing images from Appwrite Storage
function loadExistingImages() {
  storage
    .listFiles("688096dd0000d42d7c74")
    .then((response) => {
      const files = response.files

      files.reverse().forEach((file) => {
        console.log(file.$id)
        const imageData = {
          id: file.$id,
          name: file.name,
          uploadDate: new Date(file.$createdAt).toLocaleDateString(),
          url: getImageUrl(file.$id),
        }

        uploadedImages.push(imageData)
        addImageToGrid(imageData)
      })
    })
    .catch((error) => {
      console.error("Error loading images from Appwrite:", error)
      showStatus("Failed to load images: " + error.message, "error")
    })
}

// Load more images
function loadMoreImages() {
  // Placeholder function - in real app, fetch more images from Appwrite
  showStatus("Loading more images...", "loading")

  setTimeout(() => {
    showStatus("All images loaded!", "success")
  }, 1000)
}

// Scroll to upload section
function scrollToUpload() {
  gsap.to(window, {
    duration: 1,
    scrollTo: "#upload",
    ease: "power2.inOut",
  })
}

// Smooth scroll for all internal links
document.addEventListener("click", (e) => {
  if (e.target.matches('a[href^="#"]')) {
    e.preventDefault()
    const target = document.querySelector(e.target.getAttribute("href"))
    if (target) {
      gsap.to(window, {
        duration: 1,
        scrollTo: target,
        ease: "power2.inOut",
      })
    }
  }
})

// Header scroll effect
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header")
  if (window.scrollY > 100) {
    header.style.background = "rgba(255, 255, 255, 0.98)"
    header.style.boxShadow = "0 2px 20px rgba(0, 0, 0, 0.1)"
  } else {
    header.style.background = "rgba(255, 255, 255, 0.95)"
    header.style.boxShadow = "none"
  }
})
