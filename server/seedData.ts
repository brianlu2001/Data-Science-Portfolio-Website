import { storage } from './storage';
import { SiteSettings } from '../shared/schema';

const siteSettings: SiteSettings = {
  id: 1,
  contactEmail: 'brian901231@gmail.com',
  contactPhone: '8056897961',
  bio: "Welcome to Kuan-I (Brian) Lu's Data Science Portfolio! Here, you'll find a collection of projects that highlight my journey through the diverse world of data science. From machine learning and time series analysis to signal processing, linear regression, and hands-on data cleaning, these projects span a wide range of disciplines and challenges. Take a look around—hope you enjoy exploring as much as I enjoyed building them!",
  linkedinUrl: 'https://www.linkedin.com/in/kuan-i-lu/',
  updatedAt: new Date()
};

const projects = [
  {
    id: 1,
    title: 'AI Music Detection with Deep Learning',
    simplifiedDescription: `Deep learning model using CNN and Transformer architectures to detect AI-generated music, achieving 89% accuracy in distinguishing artificial from human-created compositions.`,
    fullDescription: `As AI-generated music becomes increasingly sophisticated, the need for reliable detection methods has grown critical. This project addresses this challenge by developing an advanced deep learning system that can distinguish between AI-generated and human-created music with remarkable accuracy.

Our approach leverages state-of-the-art Convolutional Neural Networks (CNNs) and Transformer architectures to analyze spectral patterns, temporal dependencies, and subtle audio characteristics that differentiate artificial compositions from human creativity. The system processes raw audio through multiple feature extraction pipelines, combining time-frequency analysis with learned representations.

One of our key achievements was increasing out-of-sample classification accuracy from the benchmark's 20% to nearly 90%.

Through the course of this work, we discovered that the key to building a robust detection model wasn't just architecture, it was data diversity. We assembled a comprehensive dataset that included both AI-generated and human-created music from various sources, ensuring our model could generalize across different musical styles and generation techniques.`,
    technologies: ['Python', 'TensorFlow', 'PyTorch', 'CNN', 'Transformers', 'Deep Learning', 'Audio Processing'],
    category: 'Machine Learning',
    imageUrl: '/uploads/bert-diagram.png', // Using BERT diagram as placeholder for deep learning
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
    technologies: ['Python', 'Scikit-learn', 'XGBoost', 'Pandas', 'Machine Learning', 'Feature Engineering', 'Business Analytics'],
    category: 'Machine Learning',
    imageUrl: '/uploads/itri-logo.png',
    projectUrl: '/reports/startup-success-prediction.html',
    githubUrl: '',
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    title: 'Compressed Sensing and Basis Pursuit',
    simplifiedDescription: `Mathematical optimization project implementing compressed sensing algorithms and basis pursuit techniques for signal reconstruction and sparse representation.`,
    fullDescription: `This advanced mathematical project explores the theoretical foundations and practical applications of compressed sensing, a revolutionary approach to signal acquisition and reconstruction that challenges the traditional Nyquist sampling theorem.

The project implements basis pursuit algorithms and various optimization techniques to achieve accurate signal reconstruction from significantly fewer measurements than conventionally required. Through careful mathematical analysis and algorithm development, I demonstrated the power of sparsity assumptions in signal processing.

Key contributions include the implementation of multiple optimization solvers, comprehensive performance analysis across different signal types, and practical applications to image compression and signal recovery problems. The work showcases the intersection of linear algebra, optimization theory, and signal processing.`,
    technologies: ['MATLAB', 'Python', 'Optimization Theory', 'Linear Algebra', 'Signal Processing', 'Compressed Sensing'],
    category: 'Mathematical Optimization',
    imageUrl: '/uploads/compressed-sensing.png',
    projectUrl: '/reports/compressed-sensing-basis-pursuit.html',
    githubUrl: '',
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    title: 'Financial Risk Management: Machine Learning Survey',
    simplifiedDescription: `Comprehensive survey of machine learning applications in financial risk management, analyzing 150+ research papers and identifying key trends and methodologies.`,
    fullDescription: `This extensive research project provides a comprehensive survey of machine learning applications in financial risk management, synthesizing insights from over 150 academic papers and industry reports published between 2018-2024.

The survey systematically categorizes ML approaches across different risk domains including credit risk, market risk, operational risk, and liquidity risk. Through detailed analysis, I identified emerging trends, methodological innovations, and practical implementations that are reshaping how financial institutions approach risk management.

Key findings include the growing adoption of ensemble methods for credit scoring, the application of deep learning for fraud detection, and the integration of alternative data sources for enhanced risk assessment. The research provides valuable insights for both academics and practitioners in quantitative finance.`,
    technologies: ['Research Methodology', 'Financial Analytics', 'Machine Learning', 'Risk Management', 'Literature Review'],
    category: 'Financial Technology',
    imageUrl: '/uploads/finance-ml.png',
    projectUrl: '/reports/financial-ml-survey.pdf',
    githubUrl: '',
    sortOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 5,
    title: 'Natural Language Processing: Book Review Analysis with BERT',
    simplifiedDescription: `Advanced NLP project using BERT transformers for sentiment analysis and classification of book reviews, achieving state-of-the-art performance on multiple datasets.`,
    fullDescription: `This natural language processing project leverages the power of BERT (Bidirectional Encoder Representations from Transformers) to perform sophisticated analysis of book reviews, including sentiment classification, rating prediction, and thematic analysis.

The project involved fine-tuning pre-trained BERT models on large-scale book review datasets, implementing advanced preprocessing pipelines, and developing novel evaluation metrics for review quality assessment. Through careful hyperparameter optimization and model architecture modifications, I achieved significant improvements over baseline models.

The work demonstrates the application of state-of-the-art transformer architectures to real-world text analysis problems, showcasing techniques in transfer learning, attention mechanisms, and contextual understanding that are fundamental to modern NLP applications.`,
    technologies: ['Python', 'BERT', 'Transformers', 'PyTorch', 'Natural Language Processing', 'Sentiment Analysis', 'Deep Learning'],
    category: 'Natural Language Processing',
    imageUrl: '/uploads/bert-diagram.png',
    projectUrl: '/reports/nlp-bert-book-reviews.pdf',
    githubUrl: '',
    sortOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 6,
    title: 'Machine Learning: Predicting Spotify Hits',
    simplifiedDescription: `Predictive modeling project analyzing audio features and metadata to predict song popularity on Spotify using advanced machine learning techniques.`,
    fullDescription: `This data science project combines music information retrieval with machine learning to predict song popularity on Spotify. Using comprehensive audio feature analysis and metadata processing, I developed models that can identify characteristics of potential hit songs.

The project involved extensive data collection from Spotify's API, feature engineering of audio characteristics including tempo, valence, danceability, and acousticness, and the implementation of various machine learning algorithms from decision trees to neural networks.

Through careful analysis of musical patterns and listener preferences, the model achieved significant predictive accuracy, providing insights into the quantifiable aspects of musical appeal and commercial success in the streaming era.`,
    technologies: ['Python', 'Spotify API', 'Scikit-learn', 'Audio Analysis', 'Machine Learning', 'Data Mining'],
    category: 'Machine Learning',
    imageUrl: '/uploads/finance-ml.png', // Reusing available image
    projectUrl: '/reports/spotify-hits-prediction.html',
    githubUrl: '',
    sortOrder: 6,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 7,
    title: 'Recommender Systems: Matrix Factorization with Deep Learning',
    simplifiedDescription: `Advanced recommender system implementing matrix factorization techniques enhanced with deep learning for improved recommendation accuracy and scalability.`,
    fullDescription: `This project explores the integration of traditional matrix factorization techniques with modern deep learning approaches to create more accurate and scalable recommender systems. The work addresses key challenges in collaborative filtering including data sparsity, cold start problems, and scalability.

Through the implementation of neural matrix factorization and hybrid deep learning architectures, I developed a system that significantly outperforms traditional collaborative filtering methods. The project includes comprehensive evaluation on multiple datasets and comparison with state-of-the-art recommendation algorithms.

The research demonstrates how deep learning can enhance classical recommendation techniques, providing insights into user preference modeling and the representation learning that drives modern recommendation engines.`,
    technologies: ['Python', 'TensorFlow', 'Matrix Factorization', 'Deep Learning', 'Recommender Systems', 'Neural Networks'],
    category: 'Machine Learning',
    imageUrl: '/uploads/compressed-sensing.png', // Reusing available image
    projectUrl: '/reports/deep-learning-matrix-factorization.html',
    githubUrl: '',
    sortOrder: 7,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 8,
    title: 'Time Series Analysis: SPX Stock Price Prediction',
    simplifiedDescription: `Comprehensive time series analysis of S&P 500 index using ARIMA, LSTM, and ensemble methods for stock price prediction and volatility modeling.`,
    fullDescription: `This quantitative finance project applies advanced time series analysis techniques to predict S&P 500 index movements and model market volatility. The work combines traditional econometric methods with modern machine learning approaches to create robust forecasting models.

The project implements multiple forecasting methodologies including ARIMA models, GARCH for volatility modeling, and Long Short-Term Memory (LSTM) networks for capturing complex temporal patterns in financial data. Through careful backtesting and risk-adjusted performance evaluation, I developed insights into market behavior and predictive modeling challenges.

The research provides valuable perspectives on the application of statistical learning to financial markets, highlighting both the opportunities and limitations of quantitative approaches to market prediction.`,
    technologies: ['Python', 'LSTM', 'ARIMA', 'Time Series Analysis', 'Financial Modeling', 'TensorFlow', 'Quantitative Finance'],
    category: 'Financial Technology',
    imageUrl: '/uploads/spx-chart.png',
    projectUrl: '/reports/spx-stock-prediction.html',
    githubUrl: '',
    sortOrder: 8,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 9,
    title: 'Recommender Systems: Collaborative Filtering for Movies',
    simplifiedDescription: `Implementation of collaborative filtering algorithms for movie recommendations using matrix factorization and neighborhood-based methods.`,
    fullDescription: `This recommender systems project focuses on the implementation and evaluation of collaborative filtering techniques for movie recommendation. The work explores both memory-based and model-based approaches to provide personalized movie suggestions based on user rating patterns.

The project includes the implementation of user-based and item-based collaborative filtering, singular value decomposition (SVD), and non-negative matrix factorization (NMF). Through comprehensive evaluation using cross-validation and various recommendation metrics, I analyzed the strengths and limitations of different approaches.

The research provides insights into user behavior modeling and the cold start problem in recommendation systems, demonstrating practical solutions for real-world recommendation challenges in the entertainment industry.`,
    technologies: ['Python', 'Collaborative Filtering', 'Matrix Factorization', 'Recommender Systems', 'Data Mining', 'Scikit-learn'],
    category: 'Machine Learning',
    imageUrl: '/uploads/yelp-logo.png', // Using Yelp logo as placeholder for review-based system
    projectUrl: '/reports/movie-recommender-collaborative-filtering.html',
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
    imageUrl: '/uploads/finance-ml.png', // Reusing available image
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