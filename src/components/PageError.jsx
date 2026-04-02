import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="page-error">
            <h1>404 - Page Not Found</h1>
            <p>Sorry, the droid you are looking for does not exist.</p>
            <img
                src="/droid-buddy.svg"
                alt="Friendly sci-fi droid illustration"
                className="page-error-image"
                />
            <Link to="/" className="btn btn-primary page-error-home">
                Back Home
            </Link>
        </div>
    );
}
//had AI add an image for fun, I wanted to make the 404 page a little more enjoyable
// and less frustrating for users who might encounter it. 
//I also had AI help me implement the Link component from react-router-dom to provide a 
// clear and easy way for users to navigate back to the home page, 
// improving the overall user experience when they land on a non-existent route.