// ORCHESTR LinkedIn Profile Extractor
// Content script that runs on LinkedIn profile pages

(function() {
  'use strict';

  // Extract profile data from LinkedIn page
  function extractProfileData() {
    const data = {
      linkedinUrl: window.location.href.split('?')[0],
      firstName: '',
      lastName: '',
      headline: '',
      summary: '',
      location: '',
      connections: null,
      experiences: [],
      education: [],
      skills: [],
      languages: [],
      certifications: []
    };

    try {
      console.log('ORCHESTR: Starting profile extraction...');

      // Extract name - multiple selectors for different LinkedIn layouts
      const nameSelectors = [
        'h1.text-heading-xlarge',
        'h1[class*="text-heading-xlarge"]',
        '.pv-text-details__left-panel h1',
        'main h1',
        'h1.break-words',
        '[data-anonymize="person-name"]',
        'h1.top-card-layout__title'
      ];
      
      let nameElement = null;
      for (const selector of nameSelectors) {
        nameElement = document.querySelector(selector);
        if (nameElement) break;
      }

      if (nameElement) {
        const fullName = nameElement.textContent.trim();
        const nameParts = fullName.split(/\s+/).filter(p => p.length > 0);
        data.firstName = nameParts[0] || '';
        data.lastName = nameParts.slice(1).join(' ') || '';
        console.log('ORCHESTR: Name extracted:', data.firstName, data.lastName);
      } else {
        console.warn('ORCHESTR: Name not found');
      }

      // Extract headline - multiple selectors
      const headlineSelectors = [
        '.text-body-medium.break-words',
        '.pv-text-details__left-panel .text-body-medium',
        '[data-anonymize="headline"]',
        '.top-card-layout__headline',
        '.ph5 h2',
        'main .text-body-medium'
      ];

      for (const selector of headlineSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          data.headline = el.textContent.trim();
          console.log('ORCHESTR: Headline extracted:', data.headline);
          break;
        }
      }

      // Extract location - multiple selectors
      const locationSelectors = [
        '.text-body-small.inline.t-black--light.break-words',
        '.pv-text-details__left-panel .text-body-small',
        '[data-anonymize="location"]',
        '.top-card-layout__location',
        '.ph5 .text-body-small'
      ];

      for (const selector of locationSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent.trim()) {
          data.location = el.textContent.trim();
          console.log('ORCHESTR: Location extracted:', data.location);
          break;
        }
      }

      // Extract connections count
      const connectionsSelectors = [
        '.pv-top-card--list-bullet li.text-body-small span',
        '[class*="connections"]',
        '.top-card-layout__connections',
        'span[data-anonymize="connections"]'
      ];

      for (const selector of connectionsSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const connectionsText = el.textContent.trim();
          const match = connectionsText.match(/(\d+)/);
          if (match) {
            data.connections = parseInt(match[1], 10);
            console.log('ORCHESTR: Connections extracted:', data.connections);
            break;
          }
        }
      }

      // Extract About/Summary - multiple approaches
      const aboutSelectors = [
        '#about ~ .display-flex .pv-shared-text-with-see-more span[aria-hidden="true"]',
        '.pv-about-section .pv-about__summary-text',
        '#about ~ .inline-show-more-text span[aria-hidden="true"]',
        'section[data-section="summary"] .inline-show-more-text',
        '#about ~ .pv-shared-text-with-see-more .inline-show-more-text',
        'section[data-section="summary"] .pv-shared-text-with-see-more'
      ];

      for (const selector of aboutSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          data.summary = el.textContent.trim();
          console.log('ORCHESTR: Summary extracted, length:', data.summary.length);
          break;
        }
      }

      // Extract experiences - improved selectors
      const experienceSelectors = [
        '#experience ~ .pvs-list__outer-container > ul > li',
        'section[data-section="experience"] .pvs-list__outer-container > ul > li',
        '#experience ~ ul > li',
        'section[data-section="experience"] ul > li'
      ];

      let experienceCards = [];
      for (const selector of experienceSelectors) {
        experienceCards = Array.from(document.querySelectorAll(selector));
        if (experienceCards.length > 0) break;
      }

      console.log('ORCHESTR: Found', experienceCards.length, 'experience cards');

      experienceCards.forEach((card, index) => {
        try {
          // Try multiple selectors for title
          const titleSelectors = [
            '.t-bold span[aria-hidden="true"]',
            '.t-bold',
            'span[aria-hidden="true"]',
            '.mr1 span[aria-hidden="true"]'
          ];
          
          let titleEl = null;
          for (const sel of titleSelectors) {
            titleEl = card.querySelector(sel);
            if (titleEl && titleEl.textContent.trim()) break;
          }

          // Try multiple selectors for company
          const companySelectors = [
            '.t-normal span[aria-hidden="true"]',
            '.t-normal',
            '.pvs-entity__sub-heading span[aria-hidden="true"]'
          ];
          
          let companyEl = null;
          for (const sel of companySelectors) {
            companyEl = card.querySelector(sel);
            if (companyEl && companyEl.textContent.trim()) break;
          }

          if (titleEl && companyEl) {
            const experience = {
              title: titleEl.textContent.trim(),
              company: companyEl.textContent.trim().replace(/[·•]/g, '').trim(),
              startDate: '',
              endDate: '',
              description: ''
            };

            // Extract date range
            const dateSelectors = [
              '.pvs-entity__caption-wrapper',
              '.t-normal.t-black--light',
              '.pvs-entity__caption'
            ];

            for (const sel of dateSelectors) {
              const dateEl = card.querySelector(sel);
              if (dateEl) {
                const dateText = dateEl.textContent.trim();
                // Parse various date formats
                const dateMatch = dateText.match(/([A-Za-z]+ \d{4})\s*[-–]\s*([A-Za-z]+ \d{4}|Present|Présent|Actuel|Aujourd'hui)/i);
                if (dateMatch) {
                  experience.startDate = dateMatch[1];
                  experience.endDate = (dateMatch[2] === 'Present' || dateMatch[2] === 'Présent' || dateMatch[2] === 'Actuel' || dateMatch[2] === 'Aujourd\'hui') ? '' : dateMatch[2];
                } else {
                  // Try single date
                  const singleDate = dateText.match(/([A-Za-z]+ \d{4})/);
                  if (singleDate) {
                    experience.startDate = singleDate[1];
                  }
                }
                break;
              }
            }

            // Extract description
            const descSelectors = [
              '.pvs-list__outer-container .inline-show-more-text',
              '.pvs-entity__description',
              '.t-normal span[aria-hidden="true"]'
            ];
            
            for (const sel of descSelectors) {
              const descEl = card.querySelector(sel);
              if (descEl && descEl.textContent.trim() && descEl.textContent.trim() !== experience.company) {
                experience.description = descEl.textContent.trim();
                break;
              }
            }

            data.experiences.push(experience);
            console.log(`ORCHESTR: Experience ${index + 1}:`, experience.title, 'at', experience.company);
          }
        } catch (e) {
          console.error('ORCHESTR: Error parsing experience:', e);
        }
      });

      // Extract education
      const educationSelectors = [
        '#education ~ .pvs-list__outer-container > ul > li',
        'section[data-section="education"] .pvs-list__outer-container > ul > li',
        '#education ~ ul > li'
      ];

      let educationCards = [];
      for (const selector of educationSelectors) {
        educationCards = Array.from(document.querySelectorAll(selector));
        if (educationCards.length > 0) break;
      }

      console.log('ORCHESTR: Found', educationCards.length, 'education cards');

      educationCards.forEach((card, index) => {
        try {
          const schoolSelectors = [
            '.t-bold span[aria-hidden="true"]',
            '.t-bold',
            'span[aria-hidden="true"]'
          ];
          
          let schoolEl = null;
          for (const sel of schoolSelectors) {
            schoolEl = card.querySelector(sel);
            if (schoolEl && schoolEl.textContent.trim()) break;
          }

          if (schoolEl) {
            const education = {
              school: schoolEl.textContent.trim(),
              degree: '',
              field: '',
              year: ''
            };

            const degreeSelectors = [
              '.t-normal span[aria-hidden="true"]',
              '.t-normal'
            ];
            
            for (const sel of degreeSelectors) {
              const degreeEl = card.querySelector(sel);
              if (degreeEl && degreeEl.textContent.trim()) {
                education.degree = degreeEl.textContent.trim();
                break;
              }
            }

            // Extract year
            const yearSelectors = [
              '.pvs-entity__caption-wrapper',
              '.t-normal.t-black--light'
            ];
            
            for (const sel of yearSelectors) {
              const yearEl = card.querySelector(sel);
              if (yearEl) {
                const yearMatch = yearEl.textContent.match(/(\d{4})/);
                if (yearMatch) {
                  education.year = yearMatch[1];
                }
                break;
              }
            }

            data.education.push(education);
            console.log(`ORCHESTR: Education ${index + 1}:`, education.school);
          }
        } catch (e) {
          console.error('ORCHESTR: Error parsing education:', e);
        }
      });

      // Extract skills
      const skillSelectors = [
        '#skills ~ .pvs-list__outer-container .t-bold span[aria-hidden="true"]',
        'section[data-section="skills"] .t-bold span[aria-hidden="true"]',
        '#skills ~ ul .t-bold'
      ];

      let skillElements = [];
      for (const selector of skillSelectors) {
        skillElements = Array.from(document.querySelectorAll(selector));
        if (skillElements.length > 0) break;
      }

      skillElements.forEach(skill => {
        const skillText = skill.textContent.trim();
        if (skillText && !data.skills.includes(skillText)) {
          data.skills.push(skillText);
        }
      });

      // Limit skills to top 20
      data.skills = data.skills.slice(0, 20);
      console.log('ORCHESTR: Found', data.skills.length, 'skills');

      // Extract languages
      const languageSelectors = [
        '#languages ~ .pvs-list__outer-container .t-bold span[aria-hidden="true"]',
        'section[data-section="languages"] .t-bold span[aria-hidden="true"]'
      ];

      let languageElements = [];
      for (const selector of languageSelectors) {
        languageElements = Array.from(document.querySelectorAll(selector));
        if (languageElements.length > 0) break;
      }

      languageElements.forEach(lang => {
        const langText = lang.textContent.trim();
        if (langText && !data.languages.includes(langText)) {
          data.languages.push(langText);
        }
      });

      console.log('ORCHESTR: Found', data.languages.length, 'languages');
      console.log('ORCHESTR: Profile extraction complete:', data);

    } catch (error) {
      console.error('ORCHESTR: Error extracting profile data:', error);
    }

    return data;
  }

  // Check if we're on a profile page
  function isProfilePage() {
    const isProfile = window.location.pathname.startsWith('/in/') && 
                     window.location.pathname.split('/').length >= 3;
    console.log('ORCHESTR: Is profile page?', isProfile, window.location.pathname);
    return isProfile;
  }

  // Send data to popup when requested
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('ORCHESTR: Message received:', request);
    
    if (request.action === 'extractProfile') {
      if (isProfilePage()) {
        try {
          const profileData = extractProfileData();
          
          // Validate we got at least a name
          if (!profileData.firstName || !profileData.lastName) {
            console.warn('ORCHESTR: Incomplete profile data - missing name');
            sendResponse({ 
              success: false, 
              error: 'Could not extract profile name. Please ensure you are on a valid LinkedIn profile page.' 
            });
            return true;
          }
          
          console.log('ORCHESTR: Sending profile data to popup');
          sendResponse({ success: true, data: profileData });
        } catch (error) {
          console.error('ORCHESTR: Error in extractProfile:', error);
          sendResponse({ success: false, error: error.message });
        }
      } else {
        console.warn('ORCHESTR: Not on a profile page');
        sendResponse({ success: false, error: 'Not on a LinkedIn profile page. Please navigate to a profile (URL should contain /in/username)' });
      }
    }
    return true; // Keep message channel open for async response
  });

  // Notify that content script is ready
  console.log('ORCHESTR: Content script loaded on', window.location.href);
})();
