// Firebase Content Management Service
// Using Firebase v9 compat mode

class ContentService {
  constructor() {
    this.contentCallbacks = new Map();
  }

  // Get all published content
  async getPublishedContent() {
    try {
      const contentRef = collection(db, 'content');
      const q = query(
        contentRef,
        where('isPublished', '==', true),
        orderBy('section'),
        orderBy('order')
      );
      
      const querySnapshot = await getDocs(q);
      const content = [];
      
      querySnapshot.forEach((doc) => {
        content.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, content };
    } catch (error) {
      console.error('Error getting published content:', error);
      return { success: false, error: error.message };
    }
  }

  // Get content by section
  async getContentBySection(section) {
    try {
      const contentRef = collection(db, 'content');
      const q = query(
        contentRef,
        where('section', '==', section),
        where('isPublished', '==', true),
        orderBy('order')
      );
      
      const querySnapshot = await getDocs(q);
      const content = [];
      
      querySnapshot.forEach((doc) => {
        content.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, content };
    } catch (error) {
      console.error('Error getting content by section:', error);
      return { success: false, error: error.message };
    }
  }

  // Get content by key
  async getContentByKey(key) {
    try {
      const contentRef = collection(db, 'content');
      const q = query(
        contentRef,
        where('key', '==', key),
        where('isPublished', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          success: true,
          content: {
            id: doc.id,
            ...doc.data()
          }
        };
      } else {
        return { success: false, error: 'Content not found' };
      }
    } catch (error) {
      console.error('Error getting content by key:', error);
      return { success: false, error: error.message };
    }
  }

  // Admin: Get all content (including unpublished)
  async getAllContent() {
    try {
      const contentRef = collection(db, 'content');
      const q = query(contentRef, orderBy('section'), orderBy('order'), orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const content = [];
      
      querySnapshot.forEach((doc) => {
        content.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, content };
    } catch (error) {
      console.error('Error getting all content:', error);
      return { success: false, error: error.message };
    }
  }

  // Admin: Get content by ID
  async getContentById(id) {
    try {
      const contentDoc = await getDoc(doc(db, 'content', id));
      
      if (contentDoc.exists()) {
        return {
          success: true,
          content: {
            id: contentDoc.id,
            ...contentDoc.data()
          }
        };
      } else {
        return { success: false, error: 'Content not found' };
      }
    } catch (error) {
      console.error('Error getting content by ID:', error);
      return { success: false, error: error.message };
    }
  }

  // Admin: Create new content
  async createContent(contentData, userId) {
    try {
      const content = {
        ...contentData,
        isPublished: contentData.isPublished !== undefined ? contentData.isPublished : true,
        order: contentData.order || 0,
        type: contentData.type || 'text',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        lastModifiedBy: userId,
        version: 1,
        history: []
      };
      
      const docRef = await addDoc(collection(db, 'content'), content);
      
      return {
        success: true,
        content: {
          id: docRef.id,
          ...content
        }
      };
    } catch (error) {
      console.error('Error creating content:', error);
      return { success: false, error: error.message };
    }
  }

  // Admin: Update content
  async updateContent(id, updates, userId) {
    try {
      // Get current content for history
      const currentResult = await this.getContentById(id);
      if (!currentResult.success) {
        return currentResult;
      }
      
      const currentContent = currentResult.content;
      
      // Prepare history entry
      const historyEntry = {
        content: currentContent.content,
        version: currentContent.version || 1,
        modifiedBy: userId,
        modifiedAt: serverTimestamp(),
        note: 'Auto-saved version'
      };
      
      // Prepare update data
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        lastModifiedBy: userId,
        version: (currentContent.version || 1) + 1,
        history: [...(currentContent.history || []), historyEntry]
      };
      
      await updateDoc(doc(db, 'content', id), updateData);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating content:', error);
      return { success: false, error: error.message };
    }
  }

  // Admin: Delete content
  async deleteContent(id) {
    try {
      await deleteDoc(doc(db, 'content', id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting content:', error);
      return { success: false, error: error.message };
    }
  }

  // Listen for real-time content updates
  subscribeToContent(section = null, callback) {
    const contentRef = collection(db, 'content');
    let q;
    
    if (section) {
      q = query(
        contentRef,
        where('section', '==', section),
        where('isPublished', '==', true),
        orderBy('order')
      );
    } else {
      q = query(
        contentRef,
        where('isPublished', '==', true),
        orderBy('section'),
        orderBy('order')
      );
    }
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const content = [];
      querySnapshot.forEach((doc) => {
        content.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(content);
    });
    
    return unsubscribe;
  }

  // Admin: Listen for all content updates (including unpublished)
  subscribeToAllContent(callback) {
    const contentRef = collection(db, 'content');
    const q = query(contentRef, orderBy('section'), orderBy('order'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const content = [];
      querySnapshot.forEach((doc) => {
        content.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(content);
    });
    
    return unsubscribe;
  }

  // Group content by section
  groupContentBySection(content) {
    return content.reduce((acc, item) => {
      if (!acc[item.section]) {
        acc[item.section] = [];
      }
      acc[item.section].push(item);
      return acc;
    }, {});
  }

  // Get content statistics
  async getContentStats() {
    try {
      const allContent = await this.getAllContent();
      if (!allContent.success) {
        return allContent;
      }
      
      const content = allContent.content;
      const stats = {
        total: content.length,
        published: content.filter(item => item.isPublished).length,
        unpublished: content.filter(item => !item.isPublished).length,
        bySection: {}
      };
      
      // Count by section
      content.forEach(item => {
        if (!stats.bySection[item.section]) {
          stats.bySection[item.section] = 0;
        }
        stats.bySection[item.section]++;
      });
      
      return { success: true, stats };
    } catch (error) {
      console.error('Error getting content stats:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
export const contentService = new ContentService();
export default contentService;
