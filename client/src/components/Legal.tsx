import React from 'react';

const Legal: React.FC = () => {
  return (
    <div className="w-full px-4 py-6 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-4 text-center">Privacy Policy</h2>
      <p className="mb-4 text-gray-800">
        This game is designed for anonymous play. We do not collect personally identifiable information or create user accounts.
        We only collect the answers you submit during gameplay to adjust difficulty and analyze performance trends. All data is
        stored anonymously and used solely to improve the overall experience.
      </p>

      <h3 className="text-2xl font-semibold mt-6 mb-2">Cookies</h3>
      <p className="mb-4 text-gray-800">
        We may use session cookies to remember your temporary game preferences during each playthrough. These cookies expire
        when you close your browser or leave the site and are not used to track you beyond your current session.
      </p>

      <h3 className="text-2xl font-semibold mt-6 mb-2">Third-Party Links</h3>
      <p className="mb-4 text-gray-800">
        This project may include links to external resources for additional content or support. We are not responsible for the
        privacy practices or content of those sites—please review their policies before providing any information.
      </p>

      <h3 className="text-2xl font-semibold mt-6 mb-2">Policy Updates</h3>
      <p className="mb-4 text-gray-800">
        We may update this Privacy Policy at any time. Any changes will be posted on this page, so please check back periodically
        for the latest version.
      </p>

      <h3 className="text-2xl font-semibold mt-6 mb-2">Contact</h3>
      <p className="mb-6 text-gray-800">
        Questions or feedback? Contact us at <a href="mailto:muller98work@gmail.com" className="text-blue-600 underline">muller98work@gmail.com</a>.
      </p>

      <h2 className="text-3xl font-bold mb-4 text-center">Disclaimer</h2>
      <p className="mb-4 text-gray-800">
        All player images in this project remain the property of their respective AFL leagues, teams, or ownership groups.
        This project does not claim ownership of any third-party content and is intended solely for non-commercial entertainment
        and educational purposes. If you are a rights holder and believe any content is used improperly, please contact us at
        <a href="mailto:muller98work@gmail.com" className="text-blue-600 underline"> muller98work@gmail.com</a> and we will promptly review and remove or replace the material as appropriate.
      </p>

      <h2 className="text-3xl font-bold mb-4 text-center">Updates & Feedback</h2>
      <p className="mb-2 text-gray-800">
        The project is under continuous improvement. We welcome your suggestions and bug reports—please email us at
        <a href="mailto:muller98work@gmail.com" className="text-blue-600 underline"> muller98work@gmail.com</a>.
      </p>
      <p className="mb-8 text-gray-800">
        Major updates and release notes will be recorded in the project repository. Visit
        <a href="https://github.com/SexyZoe/AFL-Player-Guesser" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline"> GitHub: AFL-Player-Guesser</a>.
      </p>

      <div className="text-center">
        <a href="#" className="afl-button home-button">🏠 Back to Home</a>
      </div>
    </div>
  );
};

export default Legal;

