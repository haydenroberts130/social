/**
 * Hayden Roberts
 * This file acts as the client side code that interacts with the server.
 */

// Function to add a user
function addUser() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const userData = {
    username: username,
    password: password,
  };

  fetch("/add/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      if (response.status === 201) {
        alert("User created!");
        console.log("User added successfully.");
      } else {
        console.error("Failed to add user.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function goToPost() {
  window.location.href = "post.html";
}

function goToHelp() {
  window.location.href = "help.html";
}

// Function to log in a user
function login() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  const userData = {
    username: username,
    password: password,
  };

  fetch("/account/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      if (response.status === 200) {
        // Login successful, redirect to a new page or perform other actions.
        window.location.href = `/feed.html`;
      } else {
        // Login failed, display an error message.
        const loginError = document.getElementById("loginError");
        loginError.innerHTML = "Issue logging in with that info";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// document.addEventListener("DOMContentLoaded", function () {
//   const searchPostsButton = document.querySelector("#searchPostsButton");
//   const resultsContainer = document.querySelector("#results");

//   // Function to handle displaying posts
//   function displayPosts(posts) {
//     resultsContainer.innerHTML = ""; // Clear previous results

//     if (posts.length === 0) {
//       resultsContainer.textContent = "";
//       return;
//     }

//     posts.forEach((listing) => {
//       const postCard = document.createElement("div");
//       postCard.classList.add("post-card");
//       postCard.id = `postCard-${listing._id}`;

//       const image = document.createElement("p");
//       image.textContent = listing.image;

//       const caption = document.createElement("p");
//       caption.textContent = listing.description;

//       postCard.appendChild(image);
//       postCard.appendChild(caption);
//       resultsContainer.appendChild(postCard);
//     });
//   }

//   // Function to search for posts
//   function searchPosts() {
//     const keyword = document.getElementById("searchPosts").value;

//     // Make a GET request to retrieve posts matching the keyword
//     fetch(`/search/posts/${keyword}`)
//       .then((response) => response.json())
//       .then((posts) => {
//         displayPosts(posts);
//       })
//       .catch((error) => {
//         console.error("Error:", error);
//       });
//   }

//   // Function to view posts
//   function viewPosts() {
//     const urlParams = new URLSearchParams(window.location.search);
//     const username = urlParams.get("username");

//     // Make a GET request to retrieve user posts
//     fetch(`/get/posts/${username}`)
//       .then((response) => response.json())
//       .then((posts) => {
//         console.log(posts);
//         const postIds = posts.map((listing) => listing);
//         console.log(postIds);
//         const postPromises = postIds.map((postId) => {
//           return fetch(`/get/post/${postId}`)
//             .then((response) => response.json())
//             .catch((error) => {
//               console.error("Error fetching post details:", error);
//               return null; // Handle fetch error gracefully
//             });
//         });

//         Promise.all(postPromises)
//           .then((posts) => {
//             const validposts = posts.filter((post) => post !== null);
//             displayPosts(validposts);
//           })
//           .catch((error) => {
//             console.error("Error:", error);
//           });
//       })
//       .catch((error) => {
//         console.error("Error:", error);
//       });
//   }

//   if (window.location.href.includes("feed.html")) {
//     searchPostsButton.addEventListener("click", searchPosts);
//     viewPostsButton.addEventListener("click", viewPosts);

//     document
//       .getElementById("createPostButton")
//       .addEventListener("click", function () {
//         const urlParams = new URLSearchParams(window.location.search);
//         const username = urlParams.get("username");
//         window.location.href = "post.html?username=" + username;
//       });
//   }
// });

function goToPost() {
  window.location.href = "/post.html";
}

function goToFeed() {
  window.location.href = "/feed.html";
}

function goToAccount() {
  window.location.href = "/account.html";
}

function goToFeed() {
  window.location.href = "/feed.html";
}

function searchUsers() {
  const userInput = document.getElementById("sAccounts").value;
  var list = document.getElementById("list");

  fetch("/search/users/" + userInput)
    .then((response) => response.json())
    .then((users) => {
      list.innerHTML = "";
      users.forEach((user) => {
        console.log(user.username);
        const userElement = document.createElement("div");
        userElement.className = "listUsers";

        userElement.innerHTML = `
        <a href=account.html?username=${user.username}>${user.username}</a>`;
        list.appendChild(userElement);
      });
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

async function addPost() {
  try {
    // Fetch the username from the server
    const response = await fetch("/get/usernameFromCookie");
    if (!response.ok) {
      throw new Error("Failed to fetch username.");
    }

    const username = await response.text();

    // Rest of the code remains the same
    const form = new FormData();
    const photoInput = document.getElementById("photo").files[0];
    const captionInput = document.getElementById("caption").value;

    form.append("photo", photoInput);
    form.append("caption", captionInput);
    form.append("username", username);

    fetch("/upload/post", {
      method: "POST",
      body: form,
    })
      .then((response) => {
        return response;
      })
      .then((data) => {
        console.log("CHECKPOINT DELTA");
        goToFeed();
      })
      .catch((error) => {
        console.error("Error:", error);
        alert(error.message);
      });
  } catch (error) {
    console.error("Error:", error);
    alert(error.message);
  }
}
