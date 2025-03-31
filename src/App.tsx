import { useState, useEffect, ReactElement } from 'react'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import './App.css'

interface Book {
  id: string;
  title: string;
  author: string;
  status: 'reading' | 'completed' | 'want-to-read';
  rating: number;
  notes: string;
  dateAdded: string;
  userId: string;
  coverUrl?: string;
  genre?: string;
  pageCount?: number;
  currentPage?: number;
  tags?: string[];
  category?: string;
  collection?: string;
}

type NewBook = Omit<Book, 'id' | 'dateAdded' | 'userId'>;

const BEE_LOGO = "https://res.cloudinary.com/dgzpzi5oz/image/upload/v1743112322/cute-school-bee-cartoon-character-illustration-274213863_iconl_nowm_d9665v.webp";

const BOOKS_OF_DAY = [
  {
    title: "The Midnight Library",
    author: "Matt Haig",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190252i/52578297.jpg",
    authorBio: "Matt Haig is a British novelist and journalist. Born in Sheffield, England, in 1975, he has written both fiction and non-fiction books for adults and children. His work often explores themes of mental health, happiness, and the human condition. Haig's writing has been translated into over 40 languages, and he has won several awards for his work."
  },
  {
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1664458701i/32620396.jpg",
    authorBio: "Taylor Jenkins Reid is an American author known for her contemporary fiction. Born in Acton, Massachusetts, she has written several bestselling novels that often explore themes of love, fame, and personal identity. Her work has been praised for its emotional depth and compelling character development."
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1593578600i/54493401.jpg",
    authorBio: "Andy Weir is an American novelist and former computer programmer. Born in Davis, California, he first gained fame with his debut novel 'The Martian,' which was adapted into a major motion picture. His work is known for its scientific accuracy and engaging storytelling."
  },
  {
    title: "Tomorrow, and Tomorrow, and Tomorrow",
    author: "Gabrielle Zevin",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1664458701i/58784475.jpg",
    authorBio: "Gabrielle Zevin is an American novelist and screenwriter. Born in New York City, she has written several acclaimed novels for both adults and young adults. Her work often explores themes of creativity, friendship, and the intersection of art and technology."
  },
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1549608274i/40097951.jpg",
    authorBio: "Alex Michaelides is a British-Cypriot author and screenwriter. Born in Cyprus, he studied English literature at Cambridge University and screenwriting at the American Film Institute. His debut novel 'The Silent Patient' became an international bestseller."
  }
];

const PREDEFINED_BOOKS = [
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1546071216i/5907.jpg",
    description: "Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, rarely traveling any farther than his pantry or cellar. But his contentment is disturbed when the wizard Gandalf and a company of dwarves arrive on his doorstep. They embark on an epic quest to reclaim the dwarves' homeland from the fearsome dragon Smaug. Along the way, Bilbo discovers courage, friendship, and a magical ring that will change Middle-earth forever."
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320399351i/1885.jpg",
    description: "Pride and Prejudice follows the turbulent relationship between Elizabeth Bennet, the daughter of a country gentleman, and Fitzwilliam Darcy, a rich aristocratic landowner. Through witty dialogue and social commentary, Austen explores themes of love, marriage, class, and reputation in Georgian-era England. The novel masterfully portrays the journey from first impressions to true understanding."
  },
  {
    title: "1984",
    author: "George Orwell",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1657781256i/61439040.jpg",
    description: "Winston Smith works for the Ministry of Truth in London, chief city of Airstrip One. Big Brother stares out from every poster, the Thought Police uncover every act of betrayal. When Winston begins a forbidden love affair with Julia, he discovers the true nature of the Party's control and the devastating power of totalitarianism. A chilling prophecy of surveillance society and the manipulation of truth."
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1490528560i/4671.jpg",
    description: "The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, of lavish parties on Long Island at a time when The New York Times noted 'gin was the national drink and sex the national obsession.' Through the eyes of narrator Nick Carraway, Fitzgerald captures the decadence and disillusionment of the Jazz Age, exploring themes of wealth, love, and the American Dream."
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1553383690i/2657.jpg",
    description: "The story of racial injustice and the loss of innocence in the American South. Through the eyes of young Scout Finch, we witness her father, Atticus Finch, defend a Black man falsely accused of a crime. The novel explores themes of prejudice, justice, and moral growth as Scout and her brother Jem navigate the complexities of their small Alabama town."
  }
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | ReactElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [newBook, setNewBook] = useState<NewBook>({
    title: '',
    author: '',
    status: 'reading',
    rating: 0,
    notes: '',
    genre: '',
    pageCount: 0,
    currentPage: 0,
    coverUrl: ''
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authData, setAuthData] = useState({
    email: '',
    password: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const [randomBook, setRandomBook] = useState(PREDEFINED_BOOKS[0]);
  const [bookOfDay, setBookOfDay] = useState(BOOKS_OF_DAY[0]);
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'dateAdded' | 'genre'>('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [categories] = useState([
    'all',
    'fiction',
    'non-fiction',
    'fantasy',
    'mystery',
    'romance',
    'classics',
    'biography',
    'science fiction',
    'poetry'
  ]);
  const [collections] = useState([
    'all',
    'summer reads',
    'research books',
    'classics',
    'favorites',
    'to-read',
    'currently reading'
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchBooks(user.uid);
      } else {
        setBooks([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const createBee = () => {
      const bee = document.createElement('div');
      bee.className = 'bee';
      bee.style.left = `${Math.random() * 100}vw`;
      bee.style.top = `${Math.random() * 100}vh`;
      bee.style.animationDelay = `${Math.random() * 5}s`;
      document.body.appendChild(bee);
      
      // Remove bee after animation
      bee.addEventListener('animationend', () => {
        bee.remove();
      });
    };

    // Create initial bees
    for (let i = 0; i < 5; i++) {
      createBee();
    }

    // Create new bees periodically
    const interval = setInterval(createBee, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Set a random book of the day when the app loads
    const randomIndex = Math.floor(Math.random() * BOOKS_OF_DAY.length);
    setBookOfDay(BOOKS_OF_DAY[randomIndex]);
  }, []);

  const fetchBooks = (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const q = query(
        collection(db, 'books'),
        where('userId', '==', userId),
        orderBy('dateAdded', 'desc')
      );

      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          const booksData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Book[];
          setBooks(booksData);
          setIsLoading(false);
        },
        (error: any) => {
          console.error('Error fetching books:', error);
          if (error.code === 'failed-precondition') {
            setError(
              <div className="error-message">
                <p>Database index is still building. This may take a few minutes.</p>
                <p>In the meantime, you can:</p>
                <ul>
                  <li>Add new books to your collection</li>
                  <li>Edit existing books</li>
                  <li>Refresh the page in a few minutes</li>
                </ul>
              </div>
            );
          } else {
            setError('Failed to load books. Please try again.');
          }
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up books listener:', error);
      setError('Failed to load books. Please try again.');
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, authData.email, authData.password);
      } else {
        await signInWithEmailAndPassword(auth, authData.email, authData.password);
      }
      setIsLoginModalOpen(false);
      setAuthData({ email: '', password: '' });
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout. Please try again.');
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setNewBook({
      title: book.title,
      author: book.author,
      status: book.status,
      rating: book.rating,
      notes: book.notes,
      genre: book.genre || '',
      pageCount: book.pageCount || 0,
      currentPage: book.currentPage || 0,
      coverUrl: book.coverUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (bookId: string) => {
    if (window.confirm('Are you sure you want to remove this book from your hive?')) {
      try {
        await deleteDoc(doc(db, 'books', bookId));
      } catch (error: any) {
        console.error('Error deleting book:', error);
        setError(error.message || 'Failed to remove book. Please try again.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!newBook.title.trim() || !user) return;

    setError(null);
    try {
      if (editingBook) {
        await updateDoc(doc(db, 'books', editingBook.id), {
          ...newBook,
          dateAdded: editingBook.dateAdded
        });
      } else {
        const bookData = {
          ...newBook,
          dateAdded: new Date().toISOString(),
          userId: user.uid
        };
        await addDoc(collection(db, 'books'), bookData);
      }
      
      setNewBook({
        title: '',
        author: '',
        status: 'reading',
        rating: 0,
        notes: '',
        genre: '',
        pageCount: 0,
        currentPage: 0,
        coverUrl: ''
      });
      setEditingBook(null);
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving book:', error);
      setError(error.message || 'Failed to save book. Please try again.');
    }
  };

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pickRandomBook = () => {
    const randomIndex = Math.floor(Math.random() * PREDEFINED_BOOKS.length);
    setRandomBook(PREDEFINED_BOOKS[randomIndex]);
  };

  const sortedAndFilteredBooks = [...filteredBooks]
    .filter(book => selectedCategory === 'all' || book.category === selectedCategory)
    .filter(book => selectedCollection === 'all' || book.collection === selectedCollection)
    .sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (!user) {
    return (
      <div className="app-container">
        <div className="auth-container">
          <div className="header-content">
            <img 
              src={BEE_LOGO} 
              alt="BookHive Bee" 
              className="bee-logo"
            />
            <div>
              <h1>BookHive</h1>
              <p className="tagline">Where Your Literary Obsessions Swarm</p>
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="auth-buttons">
            <button className="auth-button" onClick={() => setIsLoginModalOpen(true)}>
              Sign In
            </button>
            <button className="auth-button" onClick={() => {
              setIsRegistering(true);
              setIsLoginModalOpen(true);
            }}>
              Register
            </button>
          </div>

          {isLoginModalOpen && (
            <div className="modal-overlay">
              <div className="modal wooden-frame">
                <h2>{isRegistering ? 'Join the Colony' : 'Enter the Hive'}</h2>
                <form onSubmit={handleAuth}>
                  <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                      id="email"
                      type="email"
                      value={authData.email}
                      onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                      required
                      className="wooden-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                      id="password"
                      type="password"
                      value={authData.password}
                      onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                      required
                      className="wooden-input"
                    />
                  </div>
                  <div className="modal-buttons">
                    <button type="submit" className="wooden-button">
                      {isRegistering ? 'Join Colony' : 'Enter Hive'}
                    </button>
                    <button type="button" className="wooden-button cancel-button" onClick={() => {
                      setIsLoginModalOpen(false);
                      setIsRegistering(false);
                      setError(null);
                    }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="header-content">
          <img 
            src={BEE_LOGO} 
            alt="BookHive Bee" 
            className="bee-logo"
          />
          <div>
            <h1>BookHive</h1>
            <p className="tagline">Where Your Literary Obsessions Swarm</p>
          </div>
        </div>
        <div className="header-buttons">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search your hive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="wooden-input search-input"
            />
          </div>
          <div className="button-group">
            <div className="button-container">
              <button 
                className="wooden-button add-button" 
                onClick={() => {
                  setEditingBook(null);
                  setNewBook({
                    title: '',
                    author: '',
                    status: 'reading',
                    rating: 0,
                    notes: '',
                    genre: '',
                    pageCount: 0,
                    currentPage: 0,
                    coverUrl: ''
                  });
                  setIsModalOpen(true);
                }}
              >
                Add Book
              </button>
              <span className="button-description">Add a new book to your collection</span>
            </div>
            <div className="button-container">
              <button 
                className="wooden-button" 
                onClick={() => {
                  setEditingBook(null);
                  setNewBook({
                    title: '',
                    author: '',
                    status: 'want-to-read',
                    rating: 0,
                    notes: '',
                    genre: '',
                    pageCount: 0,
                    currentPage: 0,
                    coverUrl: ''
                  });
                  setIsModalOpen(true);
                }}
              >
                Add to Reading List
              </button>
              <span className="button-description">Save a book for later reading</span>
            </div>
          </div>
        </div>
      </div>

      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          Discover
        </button>
        <button 
          className={`nav-tab ${activeTab === 'organize' ? 'active' : ''}`}
          onClick={() => setActiveTab('organize')}
        >
          Organize
        </button>
        <button 
          className={`nav-tab ${activeTab === 'engage' ? 'active' : ''}`}
          onClick={() => setActiveTab('engage')}
        >
          Engage
        </button>
      </div>

      {activeTab === 'discover' && (
        <>
          <div className="book-of-day wooden-frame">
            <img 
              src={bookOfDay.coverUrl} 
              alt={bookOfDay.title} 
              className="book-of-day-cover"
            />
            <div className="book-of-day-content">
              <span className="book-of-day-badge">Book of the Day</span>
              <h2 className="book-of-day-title">{bookOfDay.title}</h2>
              <p className="book-of-day-author">by {bookOfDay.author}</p>
              <div className="book-of-day-bio">
                <h3>About the Author</h3>
                <p>{bookOfDay.authorBio}</p>
              </div>
            </div>
          </div>

          <div className="random-book-section wooden-frame">
            <h2>Random Book Picker</h2>
            <div className="random-book-card">
              <img 
                src={randomBook.coverUrl} 
                alt={randomBook.title} 
                className="random-book-cover"
              />
              <div className="random-book-content">
                <h3>{randomBook.title}</h3>
                <p className="author">by {randomBook.author}</p>
                <p className="description">{randomBook.description}</p>
              </div>
            </div>
            <button 
              className="wooden-button randomize-button"
              onClick={pickRandomBook}
            >
              Pick Another Book
            </button>
          </div>

          <div className="books-grid">
            {sortedAndFilteredBooks.map(book => (
              <div key={book.id} className="book-card wooden-frame">
                {book.coverUrl && (
                  <div className="book-cover">
                    <img src={book.coverUrl} alt={book.title} />
                  </div>
                )}
                <div className="book-content">
                  <div className="book-header">
                    <h2>{book.title}</h2>
                    <div className="book-actions">
                      <button 
                        className="wooden-button edit-button"
                        onClick={() => handleEdit(book)}
                      >
                        Edit
                      </button>
                      <button 
                        className="wooden-button delete-button"
                        onClick={() => handleDelete(book.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="author">by {book.author}</p>
                  <div className="book-details">
                    <span className={`status-badge ${book.status}`}>
                      {book.status}
                    </span>
                    {book.genre && <span className="genre-badge">{book.genre}</span>}
                    {book.rating > 0 && (
                      <div className="rating">
                        {'★'.repeat(book.rating)}
                        {'☆'.repeat(5 - book.rating)}
                      </div>
                    )}
                  </div>
                  {book.currentPage && book.pageCount && (
                    <div className="progress-bar">
                      <div 
                        className="progress" 
                        style={{ width: `${(book.currentPage / book.pageCount) * 100}%` }}
                      />
                    </div>
                  )}
                  <p className="notes">{book.notes}</p>
                  <p className="date">Added: {new Date(book.dateAdded).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'organize' && (
        <div className="organize-section">
          <div className="organize-controls">
            <div className="sort-controls">
              <label htmlFor="sortBy">Sort by:</label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'title' | 'author' | 'dateAdded' | 'genre')}
                className="wooden-input"
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="dateAdded">Date Added</option>
                <option value="genre">Genre</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="wooden-button"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            <div className="filter-controls">
              <label htmlFor="category">Category:</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="wooden-input"
              >
                <option value="all">All Categories</option>
                {categories.filter(cat => cat !== 'all').map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <label htmlFor="collection">Collection:</label>
              <select
                id="collection"
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="wooden-input"
              >
                <option value="all">All Collections</option>
                {collections.filter(col => col !== 'all').map(collection => (
                  <option key={collection} value={collection}>
                    {collection.charAt(0).toUpperCase() + collection.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="book-grid">
            {sortedAndFilteredBooks.map((book, index) => (
              <div key={book.id} className="book-card wooden-frame">
                {book.coverUrl && (
                  <div className="book-cover">
                    <img src={book.coverUrl} alt={book.title} />
                  </div>
                )}
                <div className="book-content">
                  <div className="book-header">
                    <h2>{book.title}</h2>
                    <div className="book-actions">
                      <button 
                        className="wooden-button edit-button"
                        onClick={() => handleEdit(book)}
                      >
                        Edit
                      </button>
                      <button 
                        className="wooden-button delete-button"
                        onClick={() => handleDelete(book.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="author">by {book.author}</p>
                  <div className="book-details">
                    <span className={`status-badge ${book.status}`}>
                      {book.status}
                    </span>
                    {book.genre && <span className="genre-badge">{book.genre}</span>}
                    {book.category && <span className="category-badge">{book.category}</span>}
                    {book.collection && <span className="collection-badge">{book.collection}</span>}
                    {book.rating > 0 && (
                      <div className="rating">
                        {'★'.repeat(book.rating)}
                        {'☆'.repeat(5 - book.rating)}
                      </div>
                    )}
                  </div>
                  {book.tags && book.tags.length > 0 && (
                    <div className="tags">
                      {book.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  {book.currentPage && book.pageCount && (
                    <div className="progress-bar">
                      <div 
                        className="progress" 
                        style={{ width: `${(book.currentPage / book.pageCount) * 100}%` }}
                      />
                    </div>
                  )}
                  <p className="notes">{book.notes}</p>
                  <p className="date">Added: {new Date(book.dateAdded).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'engage' && (
        <div className="wooden-frame">
          <h2>Engage with the Community</h2>
          <p>Coming soon: Join book clubs, share reviews, and connect with other readers!</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {isLoading && (
        <div className="loading">Loading your hive...</div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal wooden-frame">
            <h2>{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
            <div className="form-group">
              <label htmlFor="title">Title:</label>
              <input
                id="title"
                type="text"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                placeholder="Enter book title"
                className="wooden-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="author">Author:</label>
              <input
                id="author"
                type="text"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                placeholder="Enter author name"
                className="wooden-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status:</label>
              <select
                id="status"
                value={newBook.status}
                onChange={(e) => setNewBook({ ...newBook, status: e.target.value as Book['status'] })}
                className="wooden-input"
              >
                <option value="reading">Reading</option>
                <option value="completed">Completed</option>
                <option value="want-to-read">Want to Read</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="rating">Rating:</label>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-button ${star <= newBook.rating ? 'active' : ''}`}
                    onClick={() => setNewBook({ ...newBook, rating: star })}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="genre">Genre:</label>
              <input
                id="genre"
                type="text"
                value={newBook.genre}
                onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
                placeholder="Enter genre"
                className="wooden-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="pageCount">Total Pages:</label>
              <input
                id="pageCount"
                type="number"
                value={newBook.pageCount}
                onChange={(e) => setNewBook({ ...newBook, pageCount: parseInt(e.target.value) || 0 })}
                className="wooden-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="currentPage">Current Page:</label>
              <input
                id="currentPage"
                type="number"
                value={newBook.currentPage}
                onChange={(e) => setNewBook({ ...newBook, currentPage: parseInt(e.target.value) || 0 })}
                className="wooden-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="coverUrl">Cover URL:</label>
              <input
                id="coverUrl"
                type="text"
                value={newBook.coverUrl}
                onChange={(e) => setNewBook({ ...newBook, coverUrl: e.target.value })}
                placeholder="Enter book cover image URL"
                className="wooden-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="notes">Notes:</label>
              <textarea
                id="notes"
                value={newBook.notes}
                onChange={(e) => setNewBook({ ...newBook, notes: e.target.value })}
                placeholder="Enter your thoughts about the book"
                rows={4}
                className="wooden-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category:</label>
              <select
                id="category"
                value={newBook.category || ''}
                onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                className="wooden-input"
              >
                <option value="">Select a category</option>
                {categories.filter(cat => cat !== 'all').map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="collection">Collection:</label>
              <select
                id="collection"
                value={newBook.collection || ''}
                onChange={(e) => setNewBook({ ...newBook, collection: e.target.value })}
                className="wooden-input"
              >
                <option value="">Select a collection</option>
                {collections.filter(col => col !== 'all').map(collection => (
                  <option key={collection} value={collection}>
                    {collection.charAt(0).toUpperCase() + collection.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma-separated):</label>
              <input
                id="tags"
                type="text"
                value={newBook.tags?.join(', ') || ''}
                onChange={(e) => setNewBook({ 
                  ...newBook, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                })}
                placeholder="e.g., adventure, mystery, romance"
                className="wooden-input"
              />
            </div>

            <div className="modal-buttons">
              <button onClick={handleSubmit} className="wooden-button">
                {editingBook ? 'Save Changes' : 'Add Book'}
              </button>
              <button className="wooden-button cancel-button" onClick={() => {
                setIsModalOpen(false);
                setEditingBook(null);
                setError(null);
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <button className="logout-button" onClick={handleLogout}>
        Sign Out
      </button>
    </div>
  );
}

export default App
