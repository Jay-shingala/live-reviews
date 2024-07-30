import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import "./App.css";

const socket = io("http://localhost:3000");

const App = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3000/reviews").then((response) => {
      setReviews(response.data);
    });

    socket.on("review-update", (update) => {
      console.log("Review update received:", update);
      switch (update.eventType) {
        case "add":
          setReviews((prev) => [update.data, ...prev]);
          break;
        case "edit":
          setReviews((prev) => prev.map((r) => (r._id === update.data._id ? update.data : r)));
          break;
        case "delete":
          setReviews((prev) => prev.filter((r) => r._id !== update.data._id));
          break;
        default:
          break;
      }
    });

    return () => {
      socket.off("review-update");
    };
  }, []);

  const deleteReview = (id) => {
    axios.delete(`http://localhost:3000/reviews/${id}`).then(() => {
      setReviews((prev) => prev.filter((review) => review._id !== id));
    });
  };

  return (
    <Router>
      <div>
        <h1>Reviews</h1>
        <Link to="/new">
          <button>Create New Review</button>
        </Link>
        <Routes>
          <Route path="/" element={<ReviewList reviews={reviews} deleteReview={deleteReview} />} />
          <Route path="/new" element={<NewReview />} />
          <Route path="/:id" element={<EditReview />} />
        </Routes>
      </div>
    </Router>
  );
};

const ReviewList = ({ reviews, deleteReview }) => (
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Title</th>
        <th>Content</th>
        <th>Date-time</th>
        <th>Edit</th>
        <th>Delete</th>
      </tr>
    </thead>
    <tbody>
      {reviews.map((review, index) => (
        <tr key={review._id}>
          <td>{index + 1}</td>
          <td>{review.title}</td>
          <td>{review.content}</td>
          <td>{new Date(review.dateTime).toLocaleString()}</td>
          <td>
            <Link to={`/${review._id}`}>Edit</Link>
          </td>
          <td>
            <button onClick={() => deleteReview(review._id)}>Delete</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const NewReview = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const saveReview = () => {
    axios.post("http://localhost:3000/reviews", { title, content }).then(() => {
      navigate("/");
    });
  };

  return (
    <div>
      <h2>New Review</h2>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Content"
      ></textarea>
      <button onClick={saveReview}>Save</button>
      <button
        onClick={() => {
          setTitle("");
          setContent("");
        }}
      >
        Reset
      </button>
      <button onClick={() => navigate("/")}>Cancel</button>
    </div>
  );
};

const EditReview = () => {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`http://localhost:3000/reviews/${id}`).then((response) => {
      setTitle(response.data.title);
      setContent(response.data.content);
    });
  }, [id]);

  const updateReview = () => {
    axios.put(`http://localhost:3000/reviews/${id}`, { title, content }).then(() => {
      navigate("/");
    });
  };

  const deleteReview = () => {
    axios.delete(`http://localhost:3000/reviews/${id}`).then(() => {
      navigate("/");
    });
  };

  return (
    <div>
      <h2>Edit Review</h2>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Content"
      ></textarea>
      <button onClick={updateReview}>Save</button>
      <button onClick={deleteReview}>Delete</button>
      <button onClick={() => navigate("/")}>Cancel</button>
    </div>
  );
};

export default App;
