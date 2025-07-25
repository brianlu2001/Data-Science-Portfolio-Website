import { storage } from './storage';
import { SiteSettings } from '@shared/schema';

const siteSettings: SiteSettings = {
  id: 1,
  name: 'Kuan-I (Brian) Lu',
  title: 'Data Science Project Portfolio',
  email: 'brian901231@gmail.com',
  phone: '8056897961',
  bio: "Welcome to Kuan-I (Brian) Lu's Data Science Portfolio! Here, you'll find a collection of projects that highlight my journey through the diverse world of data science. From machine learning and time series analysis to signal processing, linear regression, and hands-on data cleaning, these projects span a wide range of disciplines and challenges. Take a look around—hope you enjoy exploring as much as I enjoyed building them!",
  linkedinUrl: 'https://www.linkedin.com/in/kuan-i-lu/',
  githubUrl: '',
  resumeUrl: '',
  createdAt: new Date(),
  updatedAt: new Date()
};

const projects = [
  {
    id: 1,
    title: 'Machine Learning: AI Music Detection with Deep Learning',
    simplifiedDescription: `Advanced AI music detection system using deep learning to identify AI-generated music from major generators like Suno and Udio, achieving 90% accuracy.`,
    fullDescription: `The topic of music tech is the perfect intersection between my profession and my lifelong passion. This project, part of UCSB's Data Science Capstone and sponsored by Sound Ethics, a leading advocate for creator empowerment through ethical innovation, gave us the opportunity to explore some of the most cutting-edge AI music generation models in the space, including Suno and Udio, just to name a few. In this ongoing cat-and-mouse game of AI music creation and detection, our role was to develop a detection tool that could generalize across different AI generation models. We conducted extensive research and identified three benchmark papers as our starting point. Drawing from their architectures, which included both CNN-based and Transformer-based models, we introduced additional training data to help our detection model identify AI-generated songs from nearly every major music generator on the market, with high confidence.

One of our key achievements was increasing out-of-sample classification accuracy from the benchmark's 20% to nearly 90%.

Through the course of this work, we discovered that the key to building a robust detection model wasn't just architecture, it was data diversity. We assembled a comprehensive dataset that included both AI-generated and human-created music from various sources, ensuring our model could generalize across different musical styles and generation techniques.`,
    technologies: ['Python', 'TensorFlow', 'PyTorch', 'CNN', 'Transformers', 'Deep Learning', 'Audio Processing'],
    category: 'Machine Learning',
    imageUrl: '',
    projectUrl: '/reports/ai-music-detection.pdf',
    githubUrl: '',
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    title: 'Machine Learning: Predicting Success of Startups',
    simplifiedDescription: `Machine learning model predicting startup success using ensemble methods and advanced feature engineering, achieving 87% accuracy.`,
    fullDescription: `This comprehensive machine learning project analyzes startup success factors using advanced classification algorithms and ensemble methods. The project involved extensive data collection, feature engineering, and the implementation of multiple machine learning models to predict startup success with high accuracy.

Through careful analysis of various startup metrics including funding rounds, team composition, market conditions, and business model characteristics, I developed a robust predictive framework that achieved 87% accuracy in predicting startup success outcomes.

The project showcases advanced feature engineering techniques, model ensemble methods, and comprehensive validation strategies essential for real-world machine learning applications.`,
    technologies: ['Python', 'Scikit-learn', 'Pandas', 'NumPy', 'Ensemble Methods', 'Feature Engineering', 'Classification'],
    category: 'Machine Learning',
    imageUrl: '',
    projectUrl: '/reports/itri-startup-prediction.html',
    githubUrl: '',
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    title: 'Natural Language Processing: Book Review Analysis with BERT',
    simplifiedDescription: `BERT transformer model for book review sentiment analysis achieving 92% accuracy with advanced fine-tuning techniques.`,
    fullDescription: `This advanced NLP project implements BERT transformer models for comprehensive book review sentiment analysis. The project demonstrates the application of state-of-the-art pre-trained language models and custom fine-tuning techniques to achieve exceptional performance in text classification tasks.

Working with large-scale book review datasets, I developed a sophisticated analysis pipeline that not only classifies sentiment but also extracts key themes, topics, and emotional patterns from textual data. The implementation includes advanced preprocessing, model fine-tuning, and comprehensive evaluation metrics.

The project achieved 92% accuracy in sentiment classification and provides valuable insights into customer feedback patterns and reading preferences.`,
    technologies: ['Python', 'PyTorch', 'Transformers', 'BERT', 'NLTK', 'spaCy', 'Deep Learning'],
    category: 'Natural Language Processing',
    imageUrl: '',
    projectUrl: '/reports/bert-nlp-analysis.pdf',
    githubUrl: '',
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    title: 'Research: Evolution of Machine Learning in Financial Risk Management',
    simplifiedDescription: `Comprehensive research survey on machine learning evolution in financial risk management over the past decade.`,
    fullDescription: `This comprehensive research study examines the evolution and application of machine learning techniques in financial risk management over the past decade. The project involves extensive literature review, trend analysis, and empirical evaluation of ML methodologies in FRM applications.

The research explores various machine learning approaches including supervised learning, unsupervised learning, and deep learning techniques, analyzing their effectiveness in different risk management scenarios such as credit risk, market risk, and operational risk assessment.

Key findings include the identification of emerging trends, effectiveness patterns, and future directions for ML applications in financial risk management, providing valuable insights for both researchers and practitioners in the field.`,
    technologies: ['Python', 'Pandas', 'Matplotlib', 'Research Methodology', 'Statistical Analysis', 'Literature Review'],
    category: 'Research',
    imageUrl: '',
    projectUrl: '/reports/financial-ml-survey.pdf',
    githubUrl: '',
    sortOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 5,
    title: 'Research: Compressed Sensing and Basis Pursuit',
    simplifiedDescription: `Mathematical research on compressed sensing and basis pursuit algorithms for sparse signal recovery and optimization.`,
    fullDescription: `This advanced mathematical research project explores compressed sensing techniques and basis pursuit algorithms for sparse signal recovery. The project demonstrates the theoretical foundations and practical applications of compressed sensing in signal processing and data reconstruction.

The research involves the implementation of various optimization algorithms including L1 minimization, orthogonal matching pursuit, and basis pursuit denoising. Special attention is given to the mathematical properties of sparse representations and their applications in signal processing tasks.

The project showcases both theoretical understanding and practical implementation of compressed sensing techniques, making it valuable for applications in image processing, signal reconstruction, and data compression.`,
    technologies: ['Python', 'NumPy', 'SciPy', 'CVX', 'Optimization', 'Signal Processing', 'Mathematical Analysis'],
    category: 'Research',
    imageUrl: '',
    projectUrl: '/reports/compressed-sensing.html',
    githubUrl: '',
    sortOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 6,
    title: 'Recommender Systems with Deep Learning: Matrix Factorization',
    simplifiedDescription: `Deep learning recommender system using matrix factorization and neural networks for enhanced recommendation accuracy.`,
    fullDescription: `This project implements advanced recommender systems using deep learning techniques and matrix factorization methods. The system combines traditional collaborative filtering approaches with modern neural network architectures to achieve superior recommendation accuracy.

The implementation includes various matrix factorization techniques such as Non-negative Matrix Factorization (NMF), Singular Value Decomposition (SVD), and neural collaborative filtering. The project demonstrates how deep learning can enhance traditional recommendation algorithms through better feature learning and representation.

The system achieves significant improvements in recommendation accuracy and provides scalable solutions for large-scale recommendation problems in e-commerce and content platforms.`,
    technologies: ['Python', 'TensorFlow', 'Keras', 'NumPy', 'Pandas', 'Matrix Factorization', 'Deep Learning'],
    category: 'Recommender Systems',
    imageUrl: '',
    projectUrl: '/reports/deep-learning-recommender.html',
    githubUrl: '',
    sortOrder: 6,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 7,
    title: 'Recommender Systems with Collaborative Filtering: Recommending Movies',
    simplifiedDescription: `Classical collaborative filtering movie recommendation system using user-item interactions and similarity metrics.`,
    fullDescription: `This project implements classical collaborative filtering techniques for movie recommendation systems. The system uses user-item interaction data and similarity metrics to build effective recommendation algorithms that can suggest relevant movies to users based on their preferences and behavior patterns.

The implementation includes both user-based and item-based collaborative filtering approaches, along with advanced similarity measures and neighborhood selection techniques. The project demonstrates comprehensive evaluation methodologies and addresses common challenges in recommendation systems such as cold start problems and scalability issues.

The system provides accurate movie recommendations and showcases fundamental collaborative filtering techniques that form the foundation of modern recommendation systems.`,
    technologies: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'Collaborative Filtering', 'Similarity Metrics'],
    category: 'Recommender Systems',
    imageUrl: '',
    projectUrl: '/reports/movie-recommender-system.html',
    githubUrl: '',
    sortOrder: 7,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 8,
    title: 'Machine Learning: Predicting Spotify Hits',
    simplifiedDescription: `Machine learning model predicting Spotify hit songs using audio features and metadata with classification algorithms.`,
    fullDescription: `This music analytics project uses machine learning techniques to predict hit songs on Spotify by analyzing audio features, metadata, and user engagement patterns. The project demonstrates the application of classification algorithms to predict song popularity and commercial success.

The analysis includes comprehensive feature engineering using Spotify's audio features such as danceability, energy, valence, and tempo, combined with metadata like artist popularity, release timing, and genre classifications. Multiple machine learning models were implemented and evaluated to achieve optimal prediction performance.

The project provides valuable insights into the characteristics of popular music and demonstrates how data science can be applied to the entertainment industry for hit prediction and music recommendation.`,
    technologies: ['Python', 'Scikit-learn', 'Pandas', 'Spotify API', 'Feature Engineering', 'Classification', 'Music Analytics'],
    category: 'Machine Learning',
    imageUrl: '',
    projectUrl: '/reports/spotify-hits-prediction.html',
    githubUrl: '',
    sortOrder: 8,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 9,
    title: 'Time Series: SPX Stock Price',
    simplifiedDescription: `Time series analysis for S&P 500 stock price forecasting using ARIMA, LSTM, and ensemble methods.`,
    fullDescription: `This time series analysis project focuses on S&P 500 stock price forecasting using advanced statistical methods and machine learning techniques. The project demonstrates comprehensive time series modeling approaches including ARIMA, LSTM networks, and ensemble methods for financial market prediction.

The analysis includes extensive data preprocessing, feature engineering with technical indicators, and the implementation of multiple forecasting models. Special attention is given to volatility modeling, trend analysis, and risk assessment in financial time series data.

The project showcases advanced time series forecasting techniques and provides insights into financial market dynamics, making it valuable for quantitative finance applications and investment strategy development.`,
    technologies: ['Python', 'Pandas', 'NumPy', 'Statsmodels', 'PyTorch', 'ARIMA', 'LSTM', 'Financial Analysis'],
    category: 'Time Series Analysis',
    imageUrl: '',
    projectUrl: '/reports/spx-stock-prediction.html',
    githubUrl: '',
    sortOrder: 9,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 10,
    title: 'Linear Regression: NBA Salary Inference',
    simplifiedDescription: `Linear regression analysis predicting NBA player salaries based on performance metrics and statistical analysis.`,
    fullDescription: `This statistical analysis project uses linear regression techniques to predict NBA player salaries based on performance metrics, career statistics, and market factors. The project demonstrates comprehensive regression analysis including feature selection, model validation, and statistical inference.

The analysis includes extensive exploratory data analysis of NBA player statistics, salary cap considerations, and market dynamics. Multiple regression models were implemented with proper statistical testing, assumption validation, and interpretation of results.

The project provides insights into salary determinants in professional basketball and showcases fundamental regression techniques essential for statistical analysis and predictive modeling in sports analytics.`,
    technologies: ['Python', 'Pandas', 'Scikit-learn', 'Statsmodels', 'Matplotlib', 'Statistical Analysis', 'Sports Analytics'],
    category: 'Statistical Analysis',
    imageUrl: '',
    projectUrl: '/reports/nba-salary-regression.html',
    githubUrl: '',
    sortOrder: 10,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export async function seedDatabase() {
  try {
    // Seed site settings
    await storage.upsertSiteSettings(siteSettings);
    console.log('Site settings seeded successfully');

    // Seed projects
    for (const project of projects) {
      await storage.createProject(project);
      console.log(`Project "${project.title}" seeded successfully`);
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}