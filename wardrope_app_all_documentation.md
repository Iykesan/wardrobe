# Wardrope.app

## Project Description
I am building a small and simple digital wardrobe web app that allows users to manually keep track of the physical clothes they own by adding and removing items from a digital wardrobe, viewing everything they have in one place, and organizing those items into clear categories and subcategories such as tops, bottoms, shoes, accessories, and more specific types like t-shirts, jackets, jeans, or sneakers, with optional details like color, fit, season, or notes. The app lets users combine individual clothing items into outfits, save those outfits with names, mark favorites, and plan what to wear by assigning outfits to future dates so they can see ahead of time what they intend to wear and avoid unnecessary repetition. The project focuses on being clean, minimal, and reliable as a digital mirror of a user's real-world wardrobe, while future ideas and implementations include smart outfit suggestions, image uploads and automatic clothing detection, preference learning, community sharing and popularity data, trend analysis, and shopping or wardrobe gap suggestions, which are intentionally planned for later stages of development.

## Product Requirements Document
Product Requirements Document (PRD) - Wardrobe.app (Phase 1 MVP)

1. Introduction and Goals

1.1 Purpose
This document defines the requirements, features, and specifications for the Minimum Viable Product (MVP) release of Wardrobe.app. This initial version focuses on establishing a reliable, minimal, and performant core digital wardrobe management system.

1.2 Project Vision
To provide users with a clean, simple digital mirror of their physical clothing inventory, enabling effortless tracking, easy organization, and streamlined decision-making regarding what to wear, thereby reducing daily friction related to wardrobe management.

1.3 Key Success Metrics (MVP)
*   Successful manual entry, editing, and deletion of clothing items.
*   Reliable organization via user-defined categories/subcategories.
*   Ability to create, save, and view named outfits.
*   Functional outfit planning linked to future dates.
*   Positive user feedback regarding speed and minimal interface friction.
*   Stable application performance for up to 500 items.

2. Target Audience and Use Cases

2.1 Target Audience
Students and young professionals who own a moderate amount of clothing and seek digital organization to replace mental tracking or physical searching. They value speed and simplicity over feature depth in the initial adoption phase.

2.2 Primary Use Cases
1.  **Onboarding/Setup:** Quickly define a personalized, initial set of clothing categories.
2.  **Digitization:** Rapidly add new clothing items to the digital wardrobe with minimal required data entry.
3.  **Inventory Review:** View the entire digital wardrobe, filtered or sorted by category, to recall owned items.
4.  **Outfit Creation:** Combine selected individual items into a reusable outfit configuration.
5.  **Outfit Planning:** Assign a saved outfit to a specific future date for pre-selection.

3. Functional Requirements (FR)

3.1 User & Authentication
FR-1.0: The MVP will initially support a single-user mode without explicit public user authentication (e.g., local storage or simple server-side user ID mapping if necessary for initial backend setup). Full secure account management is deferred to Phase 2.

3.2 Clothing Item Management
FR-2.1: Users must be able to add a new clothing item, requiring at minimum: Item Name/Type, Category assignment, and Subcategory assignment.
FR-2.2: Users must be able to view a comprehensive list or grid of all owned items.
FR-2.3: Users must be able to edit existing item details (including adding optional details later).
FR-2.4: Users must be able to delete items from the wardrobe.
FR-2.5: Optional details per item (to be added post-creation via edit): Color, Fit (e.g., slim, relaxed), Season (e.g., Summer, All-Season), Notes/Tags.
FR-2.6: **Data Entry Philosophy Enforcement:** The item creation flow must prioritize speed, making fields for Color, Fit, Season, and Notes truly optional and skippable during initial entry (as per Questionnaire Answer).

3.3 Categorization and Structure
FR-3.1: The application must guide the user through a personalized setup flow upon first launch to establish initial categories (e.g., Tops, Bottoms, Shoes) and relevant subcategories (e.g., T-Shirts, Jeans, Sneakers).
FR-3.2: Users must be able to view their wardrobe filtered strictly by a selected Category, and subsequently by a Subcategory within that view.
FR-3.3: Users must be able to add new custom categories and subcategories, and rename/delete existing ones post-setup.

3.4 Outfit Management
FR-4.1: Users must be able to create a new outfit by selecting one or more items from their wardrobe inventory.
FR-4.2: Saved outfits must support an optional, user-defined Name (e.g., "Friday Dinner Outfit").
FR-4.3: Users must be able to view a list of all saved outfits.
FR-4.4: Users must be able to edit an existing outfit (change items, rename).
FR-4.5: Users must be able to delete saved outfits.
FR-4.6: Users must be able to mark specific outfits as a \"Favorite.\"

3.5 Wardrobe Planning
FR-5.1: Users must be able to assign a saved outfit to a specific future date via a calendar or date picker interface.
FR-5.2: The application must provide a clear view (e.g., a calendar or timeline) showing which outfit is planned for which future date.
FR-5.3: Users must be able to review what they have planned for upcoming days, aiding in decision avoidance.
FR-5.4: Users must be able to remove a planned outfit assignment from a date.

4. Non-Functional Requirements (NFR)

4.1 Performance
NFR-1.1: Initial page load and core listing views (Wardrobe/Outfits) must remain responsive and usable for wardrobes containing up to 500 items (as per Questionnaire Answer).
NFR-1.2: Item addition and saving of outfits must complete within 1 second under normal network conditions.

4.2 Design and Usability
NFR-2.1: The application design must adhere to a clean, minimal aesthetic, prioritizing whitespace, clear typography, and low visual noise (inspiration: Notion/Google Keep).
NFR-2.2: The interface must favor muted, neutral colors with sufficient contrast for high readability.
NFR-2.3: Basic accessibility standards must be met for the MVP, including readable font sizes and keyboard focus indicators.
NFR-2.4: The application is initially scoped as a desktop-first web experience, ensuring primary workflows are optimized for larger screens.

4.3 Data Integrity and Persistence
NFR-3.1: All user-created wardrobe data (items, categories, outfits, plans) must be persisted reliably across sessions.
NFR-3.2: **Initial Data Handling:** No support for data import (e.g., CSV/spreadsheet import) is required for the MVP. Data entry starts strictly via manual creation.

5. Technical Specifications

5.1 Technology Stack (MVP)
*   **Frontend/Backend Framework:** Next.js
*   **Database/Data Layer:** Supabase (for initial persistence and scalability planning)
*   **Deployment:** Vercel

5.2 Data Model (Conceptual)
The core entities required for MVP:
*   User (Minimal structure needed for Supabase integration)
*   Category (Name, ID, Parent Category ID for hierarchy)
*   Item (Name, Category_ID, Subcategory_ID, Optional Details fields)
*   Outfit (Name, List of Item_IDs that comprise the outfit)
*   Schedule/Plan (Date, Outfit_ID)

6. Scope Definition and Future Considerations

6.1 In Scope (MVP - 1-2 Month Target)
*   All requirements listed in Section 3 (FR).
*   Core data persistence (Supabase).
*   Minimalistic desktop-optimized UI.

6.2 Out of Scope (Phase 2 and Beyond)
The following features are explicitly deferred to future iterations to maintain focus on the MVP:
*   Image uploads or automatic item detection.
*   Smart outfit suggestions based on weather or history.
*   Preference learning algorithms.
*   Community features (sharing, popularity data).
*   Shopping/Wardrobe gap suggestions.
*   Advanced accessibility compliance beyond basic contrast/readability.
*   Mobile-first responsive design (initial focus is desktop web).
*   Spreadsheet/CSV data import functionality.
*   Detailed outfit metrics (e.g., 'times worn' counter).

## Technology Stack
# Wardrope.app: Technology Stack Documentation

This document outlines the recommended technology stack for the initial Minimum Viable Product (MVP) of Wardrope.app. The choices prioritize rapid development, developer experience (DX), reliability, and alignment with the project's clean, minimal aesthetic and planned deployment environment.

## 1. Core Application Platform & Framework

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Application Framework** | Next.js (React Framework) | Chosen for its full-stack capabilities, enabling a unified codebase for frontend and backend API routes. It provides Server-Side Rendering (SSR) or Static Site Generation (SSG) capabilities if needed for performance later, but for the initial user-centric dashboard, its file-based routing and developer experience are paramount for a 1-2 month timeline. It aligns perfectly with the Vercel deployment target. |
| **Frontend Rendering** | React (via Next.js) | Standard for building modern, component-based user interfaces. Excellent ecosystem support for managing complex states (like the wardrobe inventory and outfit combinations). |
| **Styling/Design** | Tailwind CSS | Aligns with the required "clean, minimal design direction" inspired by Notion/Keep. Tailwind allows for utility-first styling, ensuring rapid development of high-contrast, content-first layouts with minimal custom CSS boilerplate. This supports the focus on functionality over heavy visual decoration. |

## 2. Data Management & Backend Services

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Database (DBaaS)** | Supabase | Selected for its integrated backend-as-a-service offering, which significantly speeds up MVP development. It provides a PostgreSQL database (reliable relational data structure needed for clothing items, categories, and outfits), real-time capabilities (future use), and authentication (if needed post-MVP), all easily consumable from Next.js. |
| **Database Choice Justification** | PostgreSQL (via Supabase) | A relational database is chosen over NoSQL because the data relationships are inherently structured (Items belong to Categories, Outfits contain Items). This structure is reliable for enforcing the relationships between clothing, categories, and scheduled dates, aligning with the need for a dependable digital mirror. |
| **Data Access Layer** | Next.js API Routes (Serverless Functions) | Used to create controlled endpoints to interact with Supabase. This keeps the database credentials secure and abstracts the data logic away from the client, even in a lightweight setup. |
| **Initial Data Handling** | Manual Entry Only | As per the plan, there is no initial requirement for complex database seeding or migration tools (like an initial spreadsheet import utility). The architecture supports simple CRUD operations which will be sufficient for manual item entry. |

## 3. Deployment & Infrastructure

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Hosting/Deployment** | Vercel | The platform of choice as specified. It offers seamless integration with Next.js, automatic environment configuration, easy CI/CD pipelines, and scaling capabilities. Ideal for a reliable launch environment focusing on a fast web app experience. |
| **Version Control** | Git / GitHub | Standard practice for tracking changes, managing the 1-2 month timeline efficiently, and facilitating any future collaboration or deployment automation via Vercel integration. |

## 4. Frontend State Management & Utilities

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Local/Global State Management** | React Context API / Zustand (or similar lightweight library) | For a simple application focused on core CRUD and scheduling, a full Redux setup is likely overkill. React Context, potentially augmented by a minimal state manager like Zustand, will handle the state required for viewing the wardrobe, managing the current outfit being built, and tracking selected dates without adding significant boilerplate. |
| **Forms & Data Entry** | React Hook Form / Zod | Essential for handling the "speed and low friction" data entry philosophy. React Hook Form simplifies form management, and Zod can be used for lightweight, schema-based validation, ensuring clean data before it hits the database, especially for required fields like item name/category. |
| **Date/Time Handling** | Date-fns or Luxon | Required for the outfit planning feature (assigning outfits to future dates). A lightweight library will handle parsing, formatting, and comparison of dates efficiently. |

## 5. Future Considerations (Post-MVP Scope)

The following technologies or practices are intentionally scoped *out* of the MVP but are supported by the chosen stack:

*   **Image Handling:** Supabase Storage (to store item photos) and a lightweight library for client-side image previews. **(Future)**
*   **Advanced Search/Filtering:** Dedicated search indexing (e.g., leveraging Supabase's vector search or later integrating Algolia/Elasticsearch) if item volume grows significantly beyond 1000 items. **(Future)**
*   **Advanced Mobile Experience:** Introduction of technologies like Capacitor or Next.js PWA features to wrap the existing web app for native-like mobile access, as the initial focus is desktop-first web. **(Future)**

## Project Structure
PROJECT STRUCTURE DOCUMENT: Wardrope.app

1. INTRODUCTION
This document outlines the file and folder structure for the Wardrope.app project, designed to support a clean, minimal, and functional digital wardrobe solution using Next.js and Supabase. The structure prioritizes maintainability, clear separation of concerns, and alignment with the defined MVP scope (manual entry, categorization, outfit saving, date planning).

2. CORE DIRECTORY STRUCTURE

/wardrope-app
├── .next/ (Generated by Next.js)
├── node_modules/ (Dependencies)
├── public/
│   ├── favicon.ico
│   └── images/ (For potential placeholder assets or future static items)
├── src/
│   ├── app/
│   ├── components/
│   ├── config/
│   ├── contexts/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   └── styles/
├── .env.local
├── next.config.js
├── package.json
├── postcss.config.js
├── README.md
└── tailwind.config.js

3. DETAILED DIRECTORY BREAKDOWN (SRC/)

3.1. src/app/
This directory manages the routing and top-level layouts for the Next.js application. Given the desktop-first focus and simple MVP, routing will be straightforward.

├── layout.tsx (Root layout providing global providers, typography, and base styling context)
├── page.tsx (Landing/Home page - will likely serve as the main Wardrobe View for the MVP)
├── wardrobe/
│   ├── page.tsx (Main view for browsing, filtering, and viewing all items)
│   └── loading.tsx
├── outfits/
│   ├── page.tsx (View to browse, create, and manage saved outfits)
│   └── loading.tsx
├── plan/
│   ├── page.tsx (Outfit calendar/planner view)
│   └── loading.tsx
└── setup/ (For initial, one-time category setup flow)
    └── page.tsx

3.2. src/components/
Reusable UI elements, structured by function. Components should be minimal and content-first, adhering to the design minimalism scope.

├── common/ (Highly reusable, generic components)
│   ├── Button.tsx
│   ├── InputField.tsx
│   ├── Modal.tsx
│   └── Typography/
├── layout/ (Structural layout components)
│   ├── Header.tsx
│   └── Sidebar.tsx (For navigation between Wardrobe, Outfits, Plan)
├── wardrobe/
│   ├── ItemCard.tsx (View for a single clothing item in a list)
│   ├── ItemForm.tsx (Used for adding/editing items - focused on low-friction data entry)
│   └── CategoryFilter.tsx
├── outfits/
│   ├── OutfitBuilder.tsx (Interface for combining items into an outfit)
│   └── OutfitCard.tsx
└── planner/
    └── CalendarView.tsx (Simple date picker/assignment interface)

3.3. src/config/
Configuration files, constants, and initial state definitions.

├── index.ts
├── categories.ts (Defines the default, suggested categories and subcategories used during initial setup)
├── constants.ts (Global string constants, application names, versioning)

3.4. src/contexts/
Manages global state using React Context, separating it from component logic.

├── AuthContext.tsx (Handles Supabase Auth state)
├── WardrobeContext.tsx (Manages the state for the list of clothing items)
├── OutfitContext.tsx (Manages the state for saved outfits)
└── AppStateContext.tsx (For managing UI state like modal visibility or current filters)

3.5. src/lib/
Helper functions, external service integrations, and utilities.

├── supabase/
│   ├── client.ts (Supabase client initialization)
│   └── queries.ts (Functions wrapping database interactions for CRUD operations on Items, Outfits, and Planning)
├── utils.ts (Generic, reusable utility functions, e.g., slug generation, date formatting)
└── validation.ts (Schema definitions for input validation, especially for ItemForm.tsx)

3.6. src/hooks/
Custom React Hooks for encapsulating complex logic.

├── useWardrobe.ts (Hook to interact with WardrobeContext/Supabase for item management)
├── useOutfits.ts (Hook for outfit creation and retrieval)
└── useLocalStorage.ts (For caching simple non-critical data if needed, although Supabase is primary)

3.7. src/types/
TypeScript definitions for data structures. Essential for type safety, especially with Supabase data structures.

├── index.ts
├── wardrobe.d.ts (Interfaces for ClothingItem, Category, Subcategory)
├── outfit.d.ts (Interfaces for Outfit structure)
└── user.d.ts (Basic user profile structure)

3.8. src/styles/
Styling entry points and foundational styles.

├── globals.css (Where Tailwind directives are imported and base styles/font definitions live)
└── themes/ (If modular styling becomes necessary, though likely minimal)

4. BASE CONFIGURATION FILES

4.1. next.config.js
Standard Next.js configuration. Will include environment variables setup for Supabase keys.

4.2. .env.local
Stores private environment variables for Supabase URL and Anon Key.

4.3. tailwind.config.js
Configured to support the minimal design philosophy. Will likely define a neutral color palette favoring high contrast and clear whitespace rules. Font stack will be set to prioritize system/clean fonts (e.g., Inter, sans-serif).

4.4. package.json
Defines dependencies. Key expected dependencies include: react, react-dom, next, tailwindcss, autoprefixer, @supabase/supabase-js, and zod (for validation).

5. DATABASE/DATA STRUCTURE CONSIDERATIONS (Reflected in src/types/)

The core data model must support the low-friction entry philosophy:

*   **User Table (Supabase Auth handles this):** Links to wardrobe data.
*   **Category Table:** Stores user-defined categories (e.g., Tops, Outerwear).
*   **Subcategory Table:** Stores user-defined subcategories, linked to a Category (e.g., T-Shirt, Sweater under Tops).
*   **Item Table:**
    *   `id`, `user_id`
    *   `name` (Required minimum)
    *   `category_id` (Required, maps to user-defined categories)
    *   `subcategory_id` (Optional)
    *   `color`, `fit`, `season`, `notes` (All Optional)
    *   `created_at`, `updated_at`
*   **Outfit Table:**
    *   `id`, `user_id`
    *   `name` (Optional for MVP, but useful for recognition)
    *   `item_ids` (Array of Item IDs making up the outfit)
*   **Plan Table:**
    *   `id`, `user_id`
    *   `outfit_id` (Links to a saved outfit)
    *   `planned_date` (Date of intended wear)

## Database Schema Design
# Schema Design: Wardrope.app

## 1. Overview and Technical Stack

This schema design supports the MVP requirements of Wardrope.app: simple management of clothing items, categorization, outfit creation, and basic date planning. The design prioritizes data integrity and performance (up to 500-1000 items) using a relational structure provided by PostgreSQL (via Supabase).

**Technology Stack:**
*   **Database:** PostgreSQL (via Supabase)
*   **Backend/API:** Next.js (API Routes)

## 2. Core Data Models

The schema consists of four primary entities: `User`, `Item`, `Outfit`, and `ScheduleEntry`. Additionally, we utilize flexible data structures for handling user-defined categories.

### 2.1. User Table (`users`)

Stores basic user authentication and profile information, linking all wardrobe data to a specific account.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| id | UUID | PRIMARY KEY, NOT NULL | Auth provider ID (e.g., Supabase auth user ID). |
| email | TEXT | UNIQUE, NOT NULL | User's email address. |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp. |

### 2.2. Clothing Item Table (`items`)

The core table storing every piece of clothing owned by the user. Minimal required fields are prioritized for fast entry.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| id | BIGSERIAL | PRIMARY KEY, NOT NULL | Unique Item ID. |
| user_id | UUID | FOREIGN KEY (users.id), NOT NULL | Owner of the item. |
| name | TEXT | NOT NULL | User-defined name (e.g., \"Striped Button Down\"). |
| category_id | INTEGER | FOREIGN KEY (categories.id), NOT NULL | Primary classification (e.g., Tops). |
| subcategory_id | INTEGER | FOREIGN KEY (subcategories.id), NULLABLE | Specific classification (e.g., T-Shirt). |
| color | TEXT | NULLABLE | Optional detail (e.g., \"Navy Blue\"). |
| fit | TEXT | NULLABLE | Optional detail (e.g., \"Slim\"). |
| season | TEXT | NULLABLE | Optional detail (e.g., \"Summer\", \"All-Season\"). |
| notes | TEXT | NULLABLE | Optional long-form notes. |
| is_favorite | BOOLEAN | NOT NULL, DEFAULT FALSE | Quick flag for frequently worn items. |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp. |

### 2.3. Category Tables (Dynamic Structure)

To support the flexible, user-defined category structure, we use two related tables. These are initialized based on user input during onboarding.

#### 2.3.1. Categories Table (`categories`)

Defines the high-level groups (e.g., Tops, Bottoms, Outerwear).

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY, NOT NULL | Unique Category ID. |
| user_id | UUID | FOREIGN KEY (users.id), NOT NULL | Owner of the category structure. |
| name | TEXT | NOT NULL | Name of the category (e.g., \"Tops\"). |
| display_order | INTEGER | NOT NULL | Used to enforce user-defined sort order. |

#### 2.3.2. Subcategories Table (`subcategories`)

Defines the specific types within a category (e.g., T-Shirt, Jeans, Sneakers).

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY, NOT NULL | Unique Subcategory ID. |
| category_id | INTEGER | FOREIGN KEY (categories.id), NOT NULL | Links to the parent category. |
| name | TEXT | NOT NULL | Name of the subcategory (e.g., \"T-Shirts\"). |
| display_order | INTEGER | NOT NULL | Used to enforce user-defined sort order within the parent category. |

*Note on relationships: `items.category_id` references `categories.id`, and `items.subcategory_id` references `subcategories.id`.*

### 2.4. Outfit Management Tables

These tables define saved combinations of clothing items.

#### 2.4.1. Outfits Table (`outfits`)

Stores the metadata for a saved outfit.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| id | BIGSERIAL | PRIMARY KEY, NOT NULL | Unique Outfit ID. |
| user_id | UUID | FOREIGN KEY (users.id), NOT NULL | Owner of the outfit. |
| name | TEXT | NOT NULL | User-defined name for the outfit (e.g., \"Weekend Casual\"). |
| is_favorite | BOOLEAN | NOT NULL, DEFAULT FALSE | Flag for quick access. |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp. |

#### 2.4.2. Outfit Composition Table (`outfit_items`)

A junction table to establish the Many-to-Many relationship between `outfits` and `items`.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| outfit_id | BIGINT | FOREIGN KEY (outfits.id), NOT NULL | The outfit being referenced. |
| item_id | BIGINT | FOREIGN KEY (items.id), NOT NULL | The item included in the outfit. |
| PRIMARY KEY | (outfit\_id, item\_id) | Composite Key | Ensures an item is listed only once per outfit. |

### 2.5. Outfit Planning Table (`schedule_entries`)

Allows users to assign a saved outfit to a specific future date for planning purposes.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| id | BIGSERIAL | PRIMARY KEY, NOT NULL | Unique Schedule Entry ID. |
| user_id | UUID | FOREIGN KEY (users.id), NOT NULL | Owner of the schedule entry. |
| outfit_id | BIGINT | FOREIGN KEY (outfits.id), NULLABLE | The outfit assigned to this date. (Null implies the user planned an outfit manually without saving it first, although MVP focuses on assigned saved outfits). |
| planned_date | DATE | NOT NULL | The specific date for which the outfit is planned. |
| description | TEXT | NULLABLE | Optional notes about the plan (e.g., "Meeting with client"). |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp. |

*Constraint Note: A unique constraint should be placed on `(user_id, planned_date)` to prevent double-booking the same day, though explicit constraints handling might be managed at the application layer if complex, non-exclusive scheduling needs arise later.*

## 3. Data Relationships Summary

1.  **One-to-Many (User to Items/Outfits/Categories):** Each primary entity (`items`, `outfits`, `categories`, `schedule_entries`) is owned by exactly one `user`.
2.  **Hierarchical Categorization:** `categories` define groups, and `subcategories` belong to one parent `category`. Items reference either the main category or the specific subcategory.
3.  **Many-to-Many (Outfits to Items):** The `outfit_items` junction table links multiple items to one outfit, and one item can belong to multiple outfits.
4.  **One-to-Many (Outfits to Schedule):** An `outfit` can be referenced by multiple `schedule_entries` across different dates, but each `schedule_entry` references one `outfit`.

## 4. Performance and Scalability Considerations (MVP Focus)

*   **Indexing:** Primary keys are indexed automatically. Foreign keys (`user_id`, `category_id`, `outfit_id`, `item_id`, `planned_date`) should be explicitly indexed for high-speed retrieval, especially when querying the large `items` table based on the `user_id`.
*   **Data Entry Philosophy:** The optional nature of fields like `color`, `fit`, and `notes` ensures that insertion performance remains fast, aligning with the low-friction data entry philosophy. Only `name`, `category_id`, and `user_id` are mandatory for item creation.
*   **Future Scaling (500+ items):** Queries fetching the entire wardrobe (e.g., for initial load) must rely on efficient filtering by `user_id` and indexed lookups. The constraint of ~500 items means full table scans are acceptable initially, but indexed joins will ensure stability as the application scales towards 1000 items per user.

## User Flow
USERFLOW DOCUMENTATION: Wardrope.app (MVP Release)

## 1. Overview and Design Principles

This document outlines the core user flows for the MVP of Wardrope.app, prioritizing speed, minimalism, and reliability. The design is heavily influenced by content-first tools like Notion and Google Keep, ensuring the interface remains clean and functional.

**Guiding Principles for Flows:**
1.  **Speed of Entry:** Minimize mandatory steps when adding items.
2.  **Clarity:** The current wardrobe, saved outfits, and planning calendar must be instantly readable.
3.  **Desktop Focus (MVP):** Flows assume a standard desktop viewport, emphasizing efficient navigation and form filling via keyboard/mouse input.

## 2. Core User Flows

### 2.1. Initial Setup and Onboarding (First-Time User)

**Goal:** Get the user from signup to a usable, categorized wardrobe structure quickly.

| Step | Action | System Response / Wireframe Description | Notes / Philosophy |
| :--- | :--- | :--- | :--- |
| 1. Welcome | User signs up/logs in (via Next.js/Supabase auth). | Splash screen/minimalist landing page. Prompt to start setup. | High contrast, minimal copy. |
| 2. Wardrobe Structure Setup (Wizard) | User answers 2-3 prompt questions: "What types of clothes do you own primarily?" (e.g., Tops, Bottoms, Shoes, Outerwear, Accessories). | The system presents a simple checklist or multi-select field based on common types. | Avoids overwhelming the user with pre-set, rigid categories. Personalization at the start. |
| 3. Initial Categorization | User optionally defines initial subcategories (e.g., Under Tops: T-Shirts, Sweaters, Blouses). | Simple modal allowing input of subcategories tied to the main selection. Users can skip this step. | Low friction: If skipped, the main category serves as the default subcategory. |
| 4. Finalization | User confirms initial structure. | Redirect to the main "Wardrobe View." A brief, dismissible toast notification confirms setup completion: \"Your digital wardrobe is ready. Start adding items!\" | Focus on immediate utility. |

### 2.2. Item Addition (Low Friction)

**Goal:** Add a new clothing item using only necessary fields, allowing optional details to be added later.

| Step | Action | System Response / Wireframe Description | Notes / Philosophy |
| :--- | :--- | :--- | :--- |
| 1. Initiation | User clicks the prominent "Add Item" button (likely a centralized `+` icon or fixed button). | Opens the "New Item Entry Modal/Panel." This panel overlays the main view (clean, high whitespace). | Modal design ensures focus. Speed is critical here. |
| 2. Mandatory Fields Entry | User inputs: 1. **Item Name/Type** (e.g., "Striped Button-Down"), 2. **Category** (Dropdown/Select, pre-filled from setup), 3. **Subcategory** (Dropdown/Select, based on Category). | Real-time validation that Category/Subcategory are selected. | Data Entry Philosophy: Only Name/Type, Category, Subcategory are required for submission. |
| 3. Optional Details (Quick Skip) | User can optionally click into fields for Color, Fit, Season, Notes, or Brand. | Fields are collapsed or appear as secondary, smaller inputs beneath the mandatory ones. | If the user tabs past these, they are left blank. |
| 4. Submission | User clicks "Save Item" (or presses Enter). | Modal closes. The newly added item appears immediately in the Wardrobe View (usually at the top if sorting is recent). | Instant feedback. The user is returned to browsing/adding. |
| 5. Post-Save Action (Optional) | User notices the new item lacks detail (e.g., Color). | A small, non-intrusive prompt near the item or a context menu option: "Edit Details." | Allows for "completeness over time" without slowing down initial entry. |

### 2.3. Viewing and Filtering the Wardrobe

**Goal:** Quickly locate specific items or browse by type.

| Step | Action | System Response / Wireframe Description | Notes / Philosophy |
| :--- | :--- | :--- | :--- |
| 1. Access | User navigates to the main application dashboard. | **Main View:** Divided into two primary panels (Desktop MVP): A persistent **Navigation/Filter Sidebar** (left) and the **Content Display Area** (right). | Clean separation of controls and content. |
| 2. Navigation/Filtering | User clicks a Category (e.g., "Bottoms") in the sidebar. | The Content Display Area updates instantly to show only items tagged with "Bottoms." | If subcategories exist, they appear nested under the main category in the sidebar, allowing drill-down. |
| 3. Viewing Item Details | User clicks on an item card in the Content Display Area. | A detailed view panel slides open (or modal appears), showing all saved metadata (Color, Season, Notes, etc.). | Must include prominent "Edit" and "Delete" actions. |
| 4. Search Functionality | User types a keyword (e.g., "red," "denim") into the persistent global search bar. | Content Display filters in real-time to show items whose Name, Color, or Notes contain the keyword. | Performance Constraint Check: Must remain responsive even approaching 500 items. |

### 2.4. Outfit Creation and Management

**Goal:** Combine existing wardrobe items into a named, savable outfit configuration.

| Step | Action | System Response / Wireframe Description | Notes / Philosophy |
| :--- | :--- | :--- | :--- |
| 1. Initiation | User navigates to the "Outfits" section and clicks "Create New Outfit." | Opens the "Outfit Builder Modal." This modal features a simplified view of the wardrobe items for selection. | Outfit Management Depth: Focus is solely on item combination. |
| 2. Item Selection | User selects items by clicking checkboxes or large item thumbnails within the Builder. (e.g., Selects T-shirt, Jeans, Sneakers). | A persistent "Outfit Preview Area" at the top of the modal updates to show thumbnails of the selected items. | Users should be able to easily add items from different primary categories (Top, Bottom, Shoe) simultaneously. |
| 3. Naming | User inputs an optional Outfit Name (e.g., "Weekend Casual"). | Input field provided prominently at the top of the builder. | Naming is optional but highly encouraged for usability later. |
| 4. Saving | User clicks "Save Outfit." | Modal closes. The new outfit appears in the Outfits List View, often prioritized with a "Favorite" star icon if applicable. | Outfit is saved as a set of Item IDs, not item copies. |
| 5. Marking Favorite | User hovers over a saved outfit and clicks the star icon. | Icon fills in/changes color. Outfit is prioritized (e.g., moved to the top of the list or given a dedicated "Favorites" tab). | Simple toggle interaction. |

### 2.5. Outfit Planning (Calendar Integration)

**Goal:** Assign a saved outfit to a specific future date to review upcoming attire.

| Step | Action | System Response / Wireframe Description | Notes / Philosophy |
| :--- | :--- | :--- | :--- |
| 1. Initiation | User navigates to the "Planning" or "Calendar" view. | Displays a clean, minimal monthly or weekly calendar (desktop focus favors weekly/list view for clarity). | Calendar view must prioritize showing *what* is planned, not just *that* something is planned. |
| 2. Scheduling an Outfit | User interacts with a specific date cell (e.g., clicks the 15th). | A small "Schedule Item" panel appears for that date, allowing selection of a saved outfit. | Low friction interaction tied directly to the date target. |
| 3. Outfit Selection | User selects an outfit from their saved list (or clicks "Quick Add Item" to select individual items, though outfit selection is primary). | If an outfit is selected, a thumbnail preview of the outfit appears on the calendar date. | If an outfit is already scheduled, selecting the date/slot opens an "Edit/Replace" prompt. |
| 4. Reviewing the Plan | User views the calendar for the upcoming week. | Dates with planned outfits clearly display the outfit name and small thumbnails of the constituent clothing items. | Solves the target audience pain point of avoiding unintentional repetition by providing a visual ahead-of-time look. |
| 5. Removing/Editing Plan | User clicks on an existing planned outfit on the calendar. | Context menu appears: "View Outfit Details," "Change Date," or "Remove Plan." | Easy modification without needing to dig into the main Outfit Management section. |

## Styling Guidelines
WARDROBE.APP - STYLING GUIDELINES DOCUMENT (DESIGN SYSTEM)

1. INTRODUCTION AND DESIGN PHILOSOPHY

Wardrope.app is designed to function as a clean, minimal, and reliable digital mirror of a user's physical wardrobe. Our core design philosophy centers on low visual noise, high usability, and content-first interaction, inspired by tools like Notion and Google Keep. The interface must always prioritize quick interaction and clarity over decoration.

1.1. Core Principles

*   **Content First:** The focus must always be on the user's clothing items and outfits. UI elements should recede to support data visibility.
*   **Minimalism & Whitespace:** Utilize ample whitespace to separate elements, improve readability, and create a calm, organized environment suitable for cataloging personal items.
*   **Efficiency:** Interactions, especially data entry, must be fast and low-friction (aligning with the data entry philosophy).
*   **Reliability:** The visual presentation should feel stable, predictable, and professional, reflecting the utility of the tool.

2. COLOR PALETTE

The initial palette favors neutral, muted tones to maintain a professional and non-distracting environment. Color should primarily be used for functional feedback (success, error) or subtle differentiation, not heavy decoration.

2.1. Primary Palette (Neutrals & Background)

| Role | Hex Code (Example) | Usage Context |
| :--- | :--- | :--- |
| Background (Canvas) | #FFFFFF (Pure White) | Primary canvas for content, lists, and main views. |
| Surface (Cards/Modals) | #F9F9F9 (Very Light Gray) | Used for interactive containers, modals, or elevated surfaces where slight separation from the main canvas is needed. |
| Text Primary | #1A1A1A (Near Black) | Main body text, headings, item names. High contrast required. |
| Text Secondary | #6B7280 (Medium Gray) | Meta-data, descriptions, subtle helper text, form field labels. |
| Border/Divider | #E5E7EB (Light Gray) | Subtle borders for separation between list items or containers. |

2.2. Functional Colors

Functional colors should be used sparingly for states and feedback.

*   **Primary Accent (Actionable Elements):** A muted, professional primary color (e.g., a subdued blue or teal, e.g., #3B82F6). Used for primary buttons, active navigation states, and key CTAs (e.g., \"Save Outfit\").
*   **Success:** Green tone (e.g., #10B981) for successful saves or confirmations.
*   **Warning/Neutral Interaction:** Yellow/Amber (e.g., #F59E0B) for minor alerts or items marked as \"Needs Review.\"
*   **Error/Danger:** Red tone (e.g., #EF4444) for destructive actions or validation errors.

2.3. Accessibility Note

All text-to-background color combinations must meet WCAG AA contrast ratio standards (minimum 4.5:1) in the final implementation.

3. TYPOGRAPHY

Typography must prioritize legibility and support the clean, content-focused aesthetic. A standard, highly legible sans-serif font family is required.

3.1. Font Family

Use a system font stack by default (e.g., `system-ui`, `Inter`, or a clean alternative like Roboto/Open Sans if custom loading is necessary) to ensure performance and native feel.

3.2. Scale and Hierarchy

The scale should be generous with sufficient line-height to enhance readability within the ample whitespace structure.

| Element | Size (px/rem) | Weight | Usage Context |
| :--- | :--- | :--- | :--- |
| H1 (Page Title) | 28px / 1.75rem | Bold (700) | Main view headers (e.g., \"My Wardrobe,\" \"Outfit Planner\"). |
| H2 (Section Header) | 20px / 1.25rem | SemiBold (600) | Headers within a view (e.g., Category titles). |
| Body Text (Default) | 16px / 1rem | Regular (400) | Item names, standard descriptions, primary form inputs. |
| Small Text/Meta | 14px / 0.875rem | Regular (400) | Category tags, optional details (color, season), timestamps. |
| Button Text | 16px / 1rem | SemiBold (600) | Clear, readable action text. |

3.3. Line Height

Set a comfortable line height of approximately 1.5 (or 150%) for body text to improve scanning and reduce reading fatigue.

4. LAYOUT AND SPACING (GRID & WHITESPACE)

The design should accommodate desktop-first use, leveraging larger screen real estate for clear information density without clutter.

4.1. Spacing Units

Use an 8-point or 4-point grid system for consistent vertical and horizontal rhythm. All padding and margins should be multiples of the base unit (e.g., 8px, 16px, 24px, 32px).

4.2. Component Spacing

*   **Item Cards:** Generous internal padding (e.g., 16px) to allow items to breathe.
*   **Section Gaps:** Significant vertical space (e.g., 32px or 48px) between major component groups (e.g., between the category list and the item view).
*   **Input Fields:** Standardized height with clear padding for focus states.

4.3. Item Representation (The \"Card\")

Clothing items should be presented in a visually lightweight card or list format.

*   **List View Focus:** Prioritize a clean list view where the item name, category, and essential tags (like color/season) are immediately visible. If images are added later, they should be thumbnail size and not dominate the view.
*   **Minimal Interaction Cues:** Use subtle hover states (slight background color change or shadow lift) rather than heavy borders to indicate interactivity.

5. UI/UX PRINCIPLES SPECIFIC TO WARDROPE.APP

5.1. Data Entry Friction Reduction

The styling must support the philosophy of speed over completeness during initial item creation.

*   **Modal/Drawer Design:** When adding an item, use a focused overlay (modal or side drawer) that defaults to only showing the required fields (Name/Type, Category, Subcategory).
*   **Progressive Disclosure:** Optional fields (Color, Fit, Season, Notes) must be visually de-emphasized or hidden behind an explicit action like \"Add Details\" or \"Edit.\" They should not clutter the initial entry form.

5.2. Navigation and Organization

Navigation must clearly reflect the core structure: Wardrobe, Outfits, Planner.

*   **Sidebar Navigation (Desktop):** A persistent, clean left-hand sidebar is preferred for primary navigation and potentially for displaying the Category structure for quick filtering.
*   **Category Filtering:** When viewing the main wardrobe, category filtering should be highly visible (e.g., pills/tags at the top) allowing users to quickly scope their view without deep menu diving.

5.3. State Management

*   **Selection & Active States:** Active navigation items or selected categories must use the Primary Accent color clearly, while maintaining sufficient contrast.
*   **Outfit Planning:** Dates in the planner view must clearly indicate if an outfit is assigned for that day (e.g., a subtle colored dot or border on the date cell).

5.4. Iconography

Icons should be simple, thin-lined (stroke-based), and consistent (e.g., Material Icons outline style or similar minimalist sets). Icons should support function without being decorative. Avoid filled or overly complex iconography.

