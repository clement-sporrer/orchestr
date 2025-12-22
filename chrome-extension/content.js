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
      // Extract name
      const nameElement = document.querySelector('h1.text-heading-xlarge') || 
                         document.querySelector('.pv-text-details__left-panel h1');
      if (nameElement) {
        const fullName = nameElement.textContent.trim();
        const nameParts = fullName.split(' ');
        data.firstName = nameParts[0] || '';
        data.lastName = nameParts.slice(1).join(' ') || '';
      }

      // Extract headline
      const headlineElement = document.querySelector('.text-body-medium.break-words') ||
                             document.querySelector('.pv-text-details__left-panel .text-body-medium');
      if (headlineElement) {
        data.headline = headlineElement.textContent.trim();
      }

      // Extract location
      const locationElement = document.querySelector('.text-body-small.inline.t-black--light.break-words') ||
                             document.querySelector('.pv-text-details__left-panel .text-body-small');
      if (locationElement) {
        data.location = locationElement.textContent.trim();
      }

      // Extract connections count
      const connectionsElement = document.querySelector('.pv-top-card--list-bullet li.text-body-small span') ||
                                document.querySelector('[class*="connections"]');
      if (connectionsElement) {
        const connectionsText = connectionsElement.textContent.trim();
        const match = connectionsText.match(/(\d+)/);
        if (match) {
          data.connections = parseInt(match[1], 10);
        }
      }

      // Extract About/Summary
      const aboutSection = document.querySelector('#about ~ .display-flex .pv-shared-text-with-see-more span[aria-hidden="true"]') ||
                          document.querySelector('.pv-about-section .pv-about__summary-text');
      if (aboutSection) {
        data.summary = aboutSection.textContent.trim();
      }

      // Extract experiences
      const experienceCards = document.querySelectorAll('#experience ~ .pvs-list__outer-container > ul > li');
      experienceCards.forEach(card => {
        try {
          const titleEl = card.querySelector('.t-bold span[aria-hidden="true"]');
          const companyEl = card.querySelector('.t-normal span[aria-hidden="true"]');
          const dateRangeEl = card.querySelector('.pvs-entity__caption-wrapper');
          
          if (titleEl && companyEl) {
            const experience = {
              title: titleEl.textContent.trim(),
              company: companyEl.textContent.trim().replace('·', '').trim(),
              startDate: '',
              endDate: '',
              description: ''
            };

            if (dateRangeEl) {
              const dateText = dateRangeEl.textContent.trim();
              // Parse date range like "Jan 2020 - Present"
              const dateMatch = dateText.match(/([A-Za-z]+ \d{4})\s*[-–]\s*([A-Za-z]+ \d{4}|Present|Présent)/);
              if (dateMatch) {
                experience.startDate = dateMatch[1];
                experience.endDate = dateMatch[2] === 'Present' || dateMatch[2] === 'Présent' ? '' : dateMatch[2];
              }
            }

            data.experiences.push(experience);
          }
        } catch (e) {
          console.error('Error parsing experience:', e);
        }
      });

      // Extract education
      const educationCards = document.querySelectorAll('#education ~ .pvs-list__outer-container > ul > li');
      educationCards.forEach(card => {
        try {
          const schoolEl = card.querySelector('.t-bold span[aria-hidden="true"]');
          const degreeEl = card.querySelector('.t-normal span[aria-hidden="true"]');
          const yearEl = card.querySelector('.pvs-entity__caption-wrapper');

          if (schoolEl) {
            const education = {
              school: schoolEl.textContent.trim(),
              degree: degreeEl ? degreeEl.textContent.trim() : '',
              field: '',
              year: ''
            };

            if (yearEl) {
              const yearMatch = yearEl.textContent.match(/(\d{4})/);
              if (yearMatch) {
                education.year = yearMatch[1];
              }
            }

            data.education.push(education);
          }
        } catch (e) {
          console.error('Error parsing education:', e);
        }
      });

      // Extract skills
      const skillElements = document.querySelectorAll('#skills ~ .pvs-list__outer-container .t-bold span[aria-hidden="true"]');
      skillElements.forEach(skill => {
        const skillText = skill.textContent.trim();
        if (skillText && !data.skills.includes(skillText)) {
          data.skills.push(skillText);
        }
      });

      // Limit skills to top 20
      data.skills = data.skills.slice(0, 20);

      // Extract languages
      const languageElements = document.querySelectorAll('#languages ~ .pvs-list__outer-container .t-bold span[aria-hidden="true"]');
      languageElements.forEach(lang => {
        const langText = lang.textContent.trim();
        if (langText && !data.languages.includes(langText)) {
          data.languages.push(langText);
        }
      });

    } catch (error) {
      console.error('ORCHESTR: Error extracting profile data:', error);
    }

    return data;
  }

  // Check if we're on a profile page
  function isProfilePage() {
    return window.location.pathname.startsWith('/in/');
  }

  // Send data to popup when requested
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractProfile') {
      if (isProfilePage()) {
        const profileData = extractProfileData();
        sendResponse({ success: true, data: profileData });
      } else {
        sendResponse({ success: false, error: 'Not on a profile page' });
      }
    }
    return true; // Keep message channel open for async response
  });

  // Notify that content script is ready
  console.log('ORCHESTR: Content script loaded on LinkedIn');
})();

