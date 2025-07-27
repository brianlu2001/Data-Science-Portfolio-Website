--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: page_views; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.page_views (
    id integer NOT NULL,
    page character varying(255) NOT NULL,
    user_agent text,
    ip_address character varying(45),
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.page_views OWNER TO neondb_owner;

--
-- Name: page_views_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.page_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.page_views_id_seq OWNER TO neondb_owner;

--
-- Name: page_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.page_views_id_seq OWNED BY public.page_views.id;


--
-- Name: project_clicks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_clicks (
    id integer NOT NULL,
    project_id integer NOT NULL,
    click_type character varying(50) NOT NULL,
    user_agent text,
    ip_address character varying(45),
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.project_clicks OWNER TO neondb_owner;

--
-- Name: project_clicks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.project_clicks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_clicks_id_seq OWNER TO neondb_owner;

--
-- Name: project_clicks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.project_clicks_id_seq OWNED BY public.project_clicks.id;


--
-- Name: project_files; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_files (
    id integer NOT NULL,
    project_id integer NOT NULL,
    file_name character varying NOT NULL,
    file_type character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    file_url character varying NOT NULL
);


ALTER TABLE public.project_files OWNER TO neondb_owner;

--
-- Name: project_files_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.project_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_files_id_seq OWNER TO neondb_owner;

--
-- Name: project_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.project_files_id_seq OWNED BY public.project_files.id;


--
-- Name: project_files_project_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.project_files_project_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_files_project_id_seq OWNER TO neondb_owner;

--
-- Name: project_files_project_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.project_files_project_id_seq OWNED BY public.project_files.project_id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    image_url character varying,
    project_url character varying,
    sort_order integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    technologies text[] DEFAULT '{}'::text[] NOT NULL,
    category character varying(100),
    github_url character varying,
    simplified_description text NOT NULL,
    full_description text NOT NULL
);


ALTER TABLE public.projects OWNER TO neondb_owner;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO neondb_owner;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: projects_sort_order_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.projects_sort_order_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_sort_order_seq OWNER TO neondb_owner;

--
-- Name: projects_sort_order_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.projects_sort_order_seq OWNED BY public.projects.sort_order;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.site_settings (
    id integer NOT NULL,
    contact_email character varying,
    contact_phone character varying,
    linkedin_url character varying,
    bio text,
    resume_url character varying,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.site_settings OWNER TO neondb_owner;

--
-- Name: site_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.site_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.site_settings_id_seq OWNER TO neondb_owner;

--
-- Name: site_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.site_settings_id_seq OWNED BY public.site_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: page_views id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.page_views ALTER COLUMN id SET DEFAULT nextval('public.page_views_id_seq'::regclass);


--
-- Name: project_clicks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_clicks ALTER COLUMN id SET DEFAULT nextval('public.project_clicks_id_seq'::regclass);


--
-- Name: project_files id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_files ALTER COLUMN id SET DEFAULT nextval('public.project_files_id_seq'::regclass);


--
-- Name: project_files project_id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_files ALTER COLUMN project_id SET DEFAULT nextval('public.project_files_project_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: projects sort_order; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects ALTER COLUMN sort_order SET DEFAULT nextval('public.projects_sort_order_seq'::regclass);


--
-- Name: site_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.site_settings ALTER COLUMN id SET DEFAULT nextval('public.site_settings_id_seq'::regclass);


--
-- Data for Name: page_views; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.page_views (id, page, user_agent, ip_address, "timestamp") FROM stdin;
\.


--
-- Data for Name: project_clicks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.project_clicks (id, project_id, click_type, user_agent, ip_address, "timestamp") FROM stdin;
\.


--
-- Data for Name: project_files; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.project_files (id, project_id, file_name, file_type, created_at, file_url) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.projects (id, title, image_url, project_url, sort_order, created_at, updated_at, technologies, category, github_url, simplified_description, full_description) FROM stdin;
1	AI Music Detection with Deep Learning	https://cdn.prod.website-files.com/66715118c4748bd61331f714/669796103c8f35e453e0fd8a_sound-ethics-share.jpg	/reports/ai-music-detection.pdf	1	2025-07-13 04:04:42.206	2025-07-14 03:52:14.372	{"Deep Learning",TensorFlow,"Audio Processing"}	Machine Learning		As part of UCSB's Data Science Capstone, we built a tool to detect AI-generated music across platforms like Suno and Udio. Starting from benchmark models with **just 20% out-of-sample accuracy**, we pushed performance to **nearly 90%** by expanding training data and improving generalization. The big insight? Model architecture matters, but *data diversity* matters more. Along the way, we uncovered deep challenges around music rights and licensing—insights I now carry into my role as VP of Strategic Ops at Sound Ethics. Click to dive into the full story behind the tech, the music, and the mission.	The topic of music tech is the perfect intersection between my profession and my lifelong passion. This project, part of UCSB's Data Science Capstone and sponsored by Sound Ethics, a leading advocate for creator empowerment through ethical innovation, gave us the opportunity to explore some of the most cutting-edge AI music generation models in the space, including Suno and Udio, just to name a few. In this ongoing cat-and-mouse game of AI music creation and detection, our role was to develop a detection tool that could generalize across different AI generation models. We conducted extensive research and identified three benchmark papers as our starting point. Drawing from their architectures, which included both CNN-based and Transformer-based models, we introduced additional training data to help our detection model identify AI-generated songs from nearly every major music generator on the market, with high confidence.\n\nOne of our key achievements was increasing out-of-sample classification accuracy from the benchmark's 20% to nearly 90%.\n\nThrough the course of this work, we discovered that the key to building a robust detection model wasn't just architecture, it was data diversity and quality. This shifted the majority of our focus in the second half of the project to data sourcing, finding both human-made and AI-generated songs. The difficulty of this process underscored the value of music property rights and the importance of licensing and partnerships in this industry, an incredibly valuable lesson, especially as I step into my new role as VP of Strategic Operations at Sound Ethics.\n\n[View Full Report](https://brianlu2001.github.io/Team%20Sound%20Ethics%20-%20Machine%20Learning%20AI%20Music%20Detection%20with%20Deep%20Learning.pdf)
2	Predicting Success of Startups	/uploads/itri-logo-updated.png	/reports/itri-startup-prediction.html	2	2025-07-13 04:04:42.206	2025-07-14 03:57:23.509	{"Deep Learning","Industrial Analytics",R}	Machine Learning		During my internship at ITRI, I worked with a rare, full-history dataset of Taiwanese startups—from inception to 2023. The goal? To quantitatively predict a company's success and support investment decisions that are usually driven by gut and experience. The biggest challenge was dealing with **massive missing data**, which we creatively imputed using industry-level averages and context-based logic. With the help of my mentor, we curated a strong set of features and reached promising predictive results that complement traditional analysis. Curious how data can uncover the next unicorn? Click in to learn more.	During my internship in Industrial Technology Research Institute (ITRI) in Taiwan, I get to access the dataset containing information of startup companies from the beginning of Taiwanese history to 2023. From the perspective of an investor or an entrepreneur, the ability to predict if a new company is going to be successful is crucial. With the right insight and analysis, investors can know which companies to pay attention to, and entrepreneurs can know which aspect they can focus on to improve. However, most industrial analyst rely on their qualitative ability, their domain knowledge, and their experience to determine which companies have better potential in succeeding. The purpose of this project is to tackle this problem from a quantitative perspective, which work as a useful tool to support or undermine certain decision or insights made by the industrial analysts in ITRI.\n\nIn this project, the main obstacle is the enormous missing values dues to the nature of the lack of transparency of start up companies. To deal with this issue, we had to impute some of the missing values by being creative and fill it based on the industries cross by the companies and the average value within these industries. As important as imputing the missing values is the decision and the selection process of the "useful" variables. Thankfully with the professional guidance and insight of my mentor during my internship here in ITRI, we have reached satisfying results.\n\n[View Full Report](https://brianlu2001.github.io/ITRI-ML-project-no-time.html)
3	Book Review Analysis with BERT	/uploads/bert-diagram.png	/reports/bert-nlp-analysis.pdf	3	2025-07-13 04:04:42.206	2025-07-14 03:59:36.193	{Tensorflow,Transformers,"Sentiment Analysis"}	Natural Language Processing		This project was the culmination of our NLP course series, predicting ratings from 1 to 5 based on review text, using a dataset of 3 million samples. We **fine-tuned DistilBERT**, chosen for its balance between performance and efficiency, after comparing it with other models like LSTM and ELMo. I led most of the coding and experimentation, optimizing model structure and navigating heavy compute limits on Colab (yes, we paid for those extra GPU hours). Despite the challenges, our final model took 8 hours to run and delivered strong results under resource constraints.	This project is the culmination of a series of courses on Natural Language Processing(NLP) with multiple Large Language Models(LLM). In this project, my team and I were given a task to predict a rating's score (integers from 1 to 5) based on the rating's text with sample size of 3 million. From all of the models we know, we decided to approach this problem by fine-tuning a DistilBERT model given the constraint of our environment and the difficulty of goals. We collectively did extensive researches understanding and comparing BERT among other models (LSTM, ELMo, etc.), as well as discovering the mechanism and advantages of DistilBERT over other BERT models. After researching and became fully prepared, we then started the experiment, which I personally did most of the heavy lifting coding and trial and error. I also made the flowchart above to better illustrate the model structure used in this project.\n\nThe greatest challenge of this project is the computation burden. Even though DistilBERT is a lighter version of BERT base and we also adapted other strategies (downsampling, layer freezing, etc.) to relief the amount of computational work to be done, we still had to wait for a long time to fit each model. Working on Google Colab, we had to purchase computational units multiple times for trial and error of model structures, which is not only monetarily demanding but also extremely time consuming. Gladly we ended up with successful and desirable results with the final model taking almost 8 hours to run.\n\n[View Full Report](https://brianlu2001.github.io/NLP%20Final%20Project%20Report%20-%20Natural%20Language%20Processing%20Book%20Review%20Analysis%20with%20BERT.pdf)
4	Evolution of Machine Learning in Financial Risk Management	/uploads/finance-ml.png	/reports/financial-ml-survey.pdf	4	2025-07-13 04:04:42.206	2025-07-14 04:01:24.431	{"Financial ML","Risk Management","Literature Review"}	Research		Blending my background in finance with what I learned in neural networks and NLP, I created a research project exploring the evolution of machine learning in Financial Risk Management (FRM). From **Bayesian inference** for time series modeling to **neural networks** for risk prediction, and eventually **reinforcement learning** for decision-making, the paper breaks down how these tools have shaped the field. I independently dove into RL literature to understand its applications, which was an intense but rewarding deep dive. This project acts as a handbook for data-driven FRM, backed by detailed methods, use cases, and benchmark results.	After learning about the underlying mechanisms of Neural Network and their application in Natural Language Processing, I wanted to combine what I've learned with my domain knowledge of finance, thus created this research project. As one may know, Financial Risk Management (FRM) can be a very data-heavy task, from fraud detection to predicting market risks, we can help saving so much unnecessary cost if we can successfully identify financial risks by leveraging the data we have. This research works as a guideline and a handbook for those in financial risk management seeking to understand the more data driven side of the task. We examined the evolution of machine learning tools used in FRM, from the simplest Bayesian Inference to find the best parameters of time series models to explain the VaR trend, to using neural network for a wider variety of tasks, to using reinforcement learning to utilize results from neural network to assist the typically man-made decision. By providing the details of the methods, applications, and related experiment results, we provide a comprehensive view of the application of machine learning in FRM tasks throughout the years.\n\nMost stages of this research went smoothly, this is no surprise since most of the learning happened in the NLP course, where I learned about the mechanisms of neural networks. However, finding adequate and reliable sources to show the proficiency of these selected methods did consume much of my energy and time. In addition, I also learned the advanced knowledge of reinforcement learning and their applications independently solely off of previous papers. This is an interesting process and I really enjoyed extracting knowledge by digging through previous scholarly works.
5	Compressed Sensing and Basis Pursuit	/uploads/compressed-sensing.png	/reports/compressed-sensing.html	5	2025-07-13 04:04:42.206	2025-07-14 04:03:35.685	{"Signal Processing",Optimization,"Sparse Representation"}	Research		This research dives into **compressed sensing and signal decomposition**, inspired by the classic paper *Atomic Decomposition by Basis Pursuit.* I compared four signal reconstruction methods—**Method of Frames, Matching Pursuit, Best Orthogonal Basis, and Basis Pursuit**—and confirmed that Basis Pursuit consistently outperforms the others in both efficiency and accuracy. The project includes mathematical proofs and pseudo-algorithms to demonstrate the logic behind the approach. As an undergrad tackling an advanced topic, I pushed my limits through deep self-learning and rigorous explanation. 	Comporessed sensing and signal decomposition is an essential part of modern data science. This research paper is based on the ideas pointed out in *"Atomic Decomposition by Basis Pursuit"*, which compared four approaches to reconstructing signals given the sparse data, these four methods are: Method of Frames, Matching Pursuit, Best Orthogonal Basis, and Basis Pursuit. This project examined the performance of these four methods and concluded that Basis Pursuit is indeed the most consistent and efficient method. Extensive mathematical proof is provided to support the validity of the algorithm which Basis Pursuit based on.\n\nAs an undergraduate student, the largest obstacle in this project is to understand an advanced topic with little prior domain knowledge. I've done the most self-learning and information mining in this project compared to any other projects I did, and I really utilized strategies to make sure I efficiently understood related knowledge from reliable sources. After understanding the information needed, I further enhance my knowledge by explaining the ideas with mathematical proof and laid out pseudo algorithms to show that I'm capable of clearly explain the idea of signal processing and Basis Pursuit.\n\n[View Full Report](https://brianlu2001.github.io/Compressed-Sensing-and-Basis-Pursuit.html)
6	Recommending Amazon Product with Matrix Factorization	https://koto.studio/wp-content/uploads/2025/04/Amazon_CS_01_Intro_00_Thumbnail.jpg	/reports/deep-learning-recommender.html	6	2025-07-13 04:04:42.206	2025-07-14 04:05:25.072	{"Deep Learning","Matrix Factorization",PyTorch}	Recommender Systems		Recommender systems are a different beast from traditional ML, so I set out to explore how deep learning performs in this space. Using the Amazon Electronics Ratings dataset, I built a model to learn latent user and item features and benchmarked it against a baseline SVD model. **Surprisingly, the classic SVD held its own, performing on par with the deep learning approach.** The project, built in Python with PyTorch, NumPy, and pandas, is presented as a concise vignette to make the insights easily digestible. 	Recommender system algorithms differ significantly from traditional supervised machine learning approaches. Building upon a previous project, this work explores the application of deep learning methods in training a recommendation model. Starting from a collaborative filtering algorithm, this project addresses challenges such as the size and sparsity of the user-item matrix, aiming to train latent user and item matrices to estimate ratings. As a baseline, we implemented Singular Value Decomposition (SVD) to benchmark the performance of the proposed model. This project is presented as a vignette, designed to efficiently and effectively convey the core ideas to readers.\n\nThe project was developed in Python using packages such as PyTorch, NumPy, and pandas. The dataset utilized was the Amazon Electronics Product Ratings dataset from Kaggle, focusing exclusively on user-item ratings. Results revealed that the baseline SVD model performed comparably to the deep learning approach. These findings suggest a potential direction for enhancing the recommender system, such as combining deep learning methods with other approaches and predicting ratings through a weighted average of multiple models.\n\n[View Full Report](https://brianlu2001.github.io/PSTAT-197-Vignette-RS-MF.html)
7	Recommending Restaurants with Collaborative Filtering	/uploads/yelp-logo.png	/reports/movie-recommender-system.html	7	2025-07-13 04:04:42.206	2025-07-14 04:07:50.579	{"Collaborative Filtering",Python,"User Behavior Analytics"}	Recommender Systems		Recommender systems shape what we eat, watch, and buy, so I built two models using **item-based collaborative filtering** on the Yelp dataset to recommend restaurants. One model takes a restaurant as input; the other starts with a user's favorites—both return the top 10 similar spots using cosine similarity. We tested the results by plugging in a well-loved local restaurant and found the model consistently surfaced other community favorites. That kind of real-world alignment shows this method's practical utility in user satisfaction. Dive into the full project if you want to see how the model knows your taste!	Recommender systems play a pivotal role in shaping our daily experiences, influencing what we see, explore, and consume. This project delves into recommender system algorithms, focusing on the widely used item-based collaborative filtering method. Using the Yelp Dataset, we constructed two models designed to recommend multiple restaurants based on either a given restaurant or a user. The first model follows a straightforward algorithmic pipeline: given a restaurant as input, the model calculates pairwise cosine similarities with all other restaurants in the dataset and returns the top 10 most similar restaurants. The second model builds upon this structure. When provided with a user, it identifies the user's top-rated restaurants and applies the same cosine similarity method to generate recommendations for each of these restaurants. The model then filters out previously visited restaurants and refines the list to return the top 10 most similar recommendations.\n\nOne key challenge in building recommender systems is evaluating their "success." In a business context, a model is deemed successful if it satisfies customers by recommending products they appreciate. To assess the performance of our models in this project, we selected a popular restaurant near our school, widely favored by the community. By analyzing the recommendations, we found that the model effectively identified other popular restaurants in the area, indicating its practical utility. This project yielded additional interesting findings.\n\n[View Full Report](https://brianlu2001.github.io/PSTAT-134-final-project-Group-1.html)
8	Predicting Spotify Hits	https://img.4gamers.com.tw/puku-clone-version/53cb4dbc919ccb10d6cc5cf98b5395b9b5091521.jpg	/reports/spotify-hits-prediction.html	8	2025-07-13 04:04:42.206	2025-07-14 04:09:23.826	{"Feature Engineering","Music Analytics","Prediction Models"}	Machine Learning		We all love sharing music, but some songs are so popular that it feels like everyone already knows them, hits just hit. This project asked a big question: **Can we predict which songs will become hits?** Using a dataset of over **1 million Spotify tracks**, we engineered features like artist tiers and classified songs into hits, regulars, and flops. After training and tuning four machine learning models, we picked the best performer and evaluated its ability to catch future bangers. Think hits are all about luck? Our results might change your mind.	We all love listening to music, and often times there will be songs so popular that most of your friends had hear about it before you introduce the songs to them, these songs are so popular that we can simply assume everyone knows the song without checking if they actually know it or not. These popular songs, or hits, are a sign of the production of a successful music producers, and many people think luck and the randomness of the market is what create these songs. But, what if there's a clear trend that we can trace to predict which songs are more likely to become hits?\n\nIn this project, we worked with a data containing over one million songs on Spotify, a streaming platform that has global presence, with the intention to predict if a song is going to be a hit or not. We started off with extensive cleaning of the data, spending much effort performing feature engineering on 1.) the popularity variable to enhance generally and classify songs into three classes (hits, regulars, flops) and 2.) the artists variable to put artists in tiers so we can avoid the redundant dummy variables. We also fitted and tuned with four types of machine learning models, selected the best one and assessed its performance.\n\n[View Full Report](https://brianlu2001.github.io/PSTAT-131-Final-Project.html)
9	Time Series SPX Stock Price	/uploads/spx-chart.png	/reports/time-series-spx.html	9	2025-07-13 04:04:42.206	2025-07-14 04:11:52.914	{"Time Series Analysis","Stock Market",Forecasting}	Time Series		The S&P 500 is one of the most watched financial indices, and this project dives into its time series behavior using **ARIMA modeling and seasonal decomposition**. I analyzed historical SPX data to identify trends, seasonality, and forecast future price movements. The project explores different model configurations and evaluates their predictive accuracy. While predicting stock prices is notoriously difficult, this analysis provides valuable insights into market patterns and the application of time series methods in finance. Perfect for understanding how statistical models approach market volatility.	The S&P 500 Index (SPX) is one of the most widely followed equity indices and serves as a benchmark for the overall U.S. stock market performance. This project applies time series analysis techniques to historical SPX data with the goal of understanding its underlying patterns and building predictive models.\n\nThe analysis begins with data exploration and visualization to identify trends, seasonality, and potential structural breaks in the series. We then apply various time series modeling techniques including ARIMA models and seasonal decomposition methods. The project evaluates different model specifications and their forecasting performance using both in-sample and out-of-sample criteria.\n\nKey challenges addressed include handling non-stationarity, identifying appropriate model orders, and dealing with the inherent volatility of financial time series. While stock price prediction remains challenging due to market efficiency and random walk behavior, this analysis demonstrates the application of formal time series methods to financial data and provides insights into market patterns.\n\n[View Full Report](https://brianlu2001.github.io/PSTAT-174-Final-Project.html)
10	NBA Salary Inference	https://sportshub.cbsistatic.com/i/r/2024/08/10/a0110e0e-543f-4df4-bf1a-660be328433b/thumbnail/1200x675/ef4ff686397ab81936a840388045033d/lebron-kd-steph-usa-medal-getty.png	/reports/nba-salary-regression.html	10	2025-07-13 04:04:42.206	2025-07-14 04:14:25.594	{"Linear Regression","Sports Analytics",R}	Linear Regression		NBA salaries have skyrocketed in recent years, and this project explores why, digging into the **relationship between player stats, team location, and more in relation to player wages**. Using linear regression and **custom features** like moving averages of scoring and efficiency, I found a clear positive correlation with next-year salary. Simple analysis, yet real insight. Check out what drives the biggest paychecks in basketball!	Being some of the highest payed athletes in the world, NBA players' salaries has experienced an unpredecending growth in any job market. This phenomenon brought the attention for scholars studying and exploring the relations, causation, and correlations of NBA salaries and different attributes, from the location of the team to the statistics the player puts up in their career. This project being my very first, I focused more on data analysis, data cleaning, and visualization in order to find the inferences of different variables with salary, rather than finding the best model to perform a prediction task. In this project, I used a simple linear regression model to discover the relations of variables. Although the outline of this project might seem simple, I did go to the extent of feature engineering to create a columns denoting the moving average of a player's scoring and effectiveness related statistic, and I also found them to be positively correlated with the salary the NBA player receives for the following year.\n\n[View Full Report](https://brianlu2001.github.io/NBA_salary_linear_regression.html)
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
3gQbCpd0P2K-bdZwc2D_jbYJL-pps35i	{"cookie": {"path": "/", "secure": true, "expires": "2025-07-28T20:59:17.662Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "9e222fbe-5935-47ce-8aab-caefb0735d2d", "exp": 1753135157, "iat": 1753131557, "iss": "https://replit.com/oidc", "sub": "44737525", "email": "brian901231@gmail.com", "at_hash": "jVcfbbgzRl2xheVlzxRngw", "username": "brian901231", "auth_time": 1752558975, "last_name": "Lu", "first_name": "Brian"}, "expires_at": 1753135157, "access_token": "b47WuwpGSSrbB31AoEQE49V3oQyop4dHU0N_5RUsETf", "refresh_token": "QO47HgXnWXD4Kky0XgtxdbfElrbIB1KcxLgbQS40XG8"}}}	2025-08-01 06:08:36
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.site_settings (id, contact_email, contact_phone, linkedin_url, bio, resume_url, updated_at) FROM stdin;
1	brian901231@gmail.com	8056897961	https://www.linkedin.com/in/kuan-i-lu/	Welcome to Kuan-I (Brian) Lu's Data Science Portfolio! Here, you'll find a collection of projects that highlight my journey through the diverse world of data science. From machine learning and time series analysis to signal processing, linear regression, and hands-on data cleaning, these projects span a wide range of disciplines and challenges. Take a look around—hope you enjoy exploring as much as I enjoyed building them!		2025-07-21 04:19:38.06
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, created_at, updated_at) FROM stdin;
44737525	brian901231@gmail.com	Brian	Lu	\N	2025-07-13 04:28:26.883463	2025-07-15 05:56:15.593
\.


--
-- Name: page_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.page_views_id_seq', 1, false);


--
-- Name: project_clicks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.project_clicks_id_seq', 1, false);


--
-- Name: project_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.project_files_id_seq', 1, false);


--
-- Name: project_files_project_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.project_files_project_id_seq', 1, false);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.projects_id_seq', 1, false);


--
-- Name: projects_sort_order_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.projects_sort_order_seq', 1, false);


--
-- Name: site_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.site_settings_id_seq', 1, false);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: project_clicks project_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_clicks
    ADD CONSTRAINT project_clicks_pkey PRIMARY KEY (id);


--
-- Name: project_files project_files_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_files
    ADD CONSTRAINT project_files_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: project_clicks project_clicks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_clicks
    ADD CONSTRAINT project_clicks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: project_files project_files_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_files
    ADD CONSTRAINT project_files_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

