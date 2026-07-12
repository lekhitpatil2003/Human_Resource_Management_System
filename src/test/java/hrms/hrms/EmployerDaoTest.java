package hrms.hrms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import hrms.hrms.entity.Employer;
import hrms.hrms.repository.EmployerDao;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class EmployerDaoTest {
	
	@Autowired
    private EmployerDao employerDao;

    private Employer validEmployer(String email) {
        Employer e = new Employer();
        e.setCompanyName("Test Company");
        e.setCompanyWebPage("https://testcompany.com");
        e.setEmail(email);
        e.setPhoneNumber("05001234567");
        e.setPassword("password123");
        return e;
    }

    @Test
    void whenValidEmployer_thenSaved() {
        Employer saved = employerDao.save(validEmployer("test@test.com"));
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCompanyName()).isEqualTo("Test Company");
    }

    @Test
    void whenDuplicateEmail_thenThrowsException() {
    	employerDao.save(validEmployer("duplicate@test.com"));
    	employerDao.flush();

        assertThrows(DataIntegrityViolationException.class, () -> {
        	employerDao.save(validEmployer("duplicate@test.com"));
            employerDao.flush();
        });
    }

}
